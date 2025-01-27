
  /**
   * Convierte un objeto JSON en un string con definiciones de clases Python.
   * Cada clave que sea un objeto anidado o un array de objetos se convierte en una subclase.
   *
   * @param jsonObject - El objeto JSON original (ya parseado).
   * @param rootClassName - Nombre de la clase raíz.
   * @returns Un string con todas las clases Python generadas.
   */
  export function convertJsonToPython(
    jsonObject: any,
    rootClassName: string = "GeneratedClass"
  ): string {
    // Almacenamos todas las clases generadas para luego concatenarlas
    const classDefinitions: string[] = [];

    /**
     * Función recursiva que genera el código de la clase para un objeto dado.
     * Crea subclases para los valores que sean a su vez objetos anidados o arrays de objetos.
     *
     * @param obj - El objeto (sub-JSON) que se convertirá en clase.
     * @param className - Nombre de la clase que se generará.
     * @returns String con la definición de la clase Python.
     */
    function buildClass(obj: any, className: string): string {
      // Guardaremos primero las declaraciones de atributos (type hints)
      let classStr = `class ${capitalize(className)}:\n`;

      // Almacena los nombres y tipos para el __init__
      const initParams: string[] = [];
      const initAssignments: string[] = [];

      // Si el objeto está vacío, definimos la clase con un simple `pass`
      // Evitamos así crear __init__ vacío
      if (!obj || Object.keys(obj).length === 0) {
        classStr += `    pass\n`;
        return classStr;
      }

      for (const key in obj) {
        const value = obj[key];

        // Decidimos el tipo Python correspondiente
        // Si es un objeto anidado, creamos subclase recursivamente
        if (isObject(value)) {
          const subClassName = capitalize(key);
          // Generamos la subclase y la añadimos al arreglo de definiciones
          classDefinitions.push(buildClass(value, subClassName));

          // Agregamos la declaración en la clase actual
          classStr += `    ${key}: ${subClassName}\n`;
          initParams.push(`${key}: ${subClassName}`);
        }
        // Si es una lista, vemos si la lista contiene objetos o primitivos
        else if (Array.isArray(value)) {
          // Manejo de array vacío: le damos tipo list[Any] por defecto
          if (value.length === 0) {
            classStr += `    ${key}: list[Any]\n`;
            initParams.push(`${key}: list[Any]`);
          } else {
            // Si el primer elemento es un objeto, generamos subclase
            if (isObject(value[0])) {
              const subClassName = capitalize(key);
              // Generamos subclase para el "modelo" de los elementos
              classDefinitions.push(buildClass(value[0], subClassName));

              classStr += `    ${key}: list[${subClassName}]\n`;
              initParams.push(`${key}: list[${subClassName}]`);
            } else {
              // Lista de primitivos
              const elemType = mapPythonType(value[0]);
              classStr += `    ${key}: list[${elemType}]\n`;
              initParams.push(`${key}: list[${elemType}]`);
            }
          }
        }
        // Si es un valor primitivo (string, number, boolean, null, etc.)
        else {
          const pythonType = mapPythonType(value);
          classStr += `    ${key}: ${pythonType}\n`;
          initParams.push(`${key}: ${pythonType}`);
        }
      }

      // Ahora, creamos el método __init__ con todos los parámetros y asignaciones
      classStr += `\n    def __init__(self, ${initParams.join(", ")}):\n`;
      for (const key in obj) {
        initAssignments.push(`        self.${key} = ${key}`);
      }
      classStr += initAssignments.join("\n") + "\n";

      return classStr;
    }

    // ----------------------------------------------------------
    //   Funciones auxiliares
    // ----------------------------------------------------------

    // Capitaliza la primera letra de una cadena
    function capitalize(str: string): string {
      if (!str || typeof str !== "string") return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Verifica si "value" es un objeto "plain" (no es null, ni array)
    function isObject(value: any): boolean {
      return value && typeof value === "object" && !Array.isArray(value);
    }

    /**
     * Dado un valor primitivo de JS, retorna el tipo Python correspondiente
     * Por simplicidad:
     *   - string -> str
     *   - number -> float (podrías implementar heurística para int)
     *   - boolean -> bool
     *   - null -> Any (o None)
     *   - de lo contrario -> Any
     */
    function mapPythonType(value: any): string {
      if (value === null || value === undefined) {
        // Podrías optar por 'None' o 'Any'
        return "Any";
      }
      switch (typeof value) {
        case "string":
          return "str";
        case "number":
          // Podrías usar 'int' si quieres forzar enteros
          return "float";
        case "boolean":
          return "bool";
        default:
          return "Any";
      }
    }

    // ----------------------------------------------------------
    //   Generación principal
    // ----------------------------------------------------------

    // Creamos la clase raíz y la añadimos a nuestras definiciones
    classDefinitions.push(buildClass(jsonObject, rootClassName));

    // Agregamos un encabezado con los imports necesarios
    let finalCode = `
from typing import Any

`;
    // Si usas List, Union, Optional, etc.:
    // from typing import Any, List, Optional, Union

    // Concatenamos todas las clases (la raíz primero, luego subclases)
    finalCode += classDefinitions.join("\n\n") + "\n";

    return finalCode;
  }

