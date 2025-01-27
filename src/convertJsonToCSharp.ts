/**
 * Convierte un objeto JSON en código C# que incluye la clase raíz y las subclases necesarias.
 * Maneja propiedades anidadas y arrays.
 *
 * @param jsonObject - Objeto JSON ya parseado.
 * @param rootClassName - Nombre de la clase raíz que se va a generar.
 * @returns Un string con el código C# resultante.
 */
export function convertJsonToCSharp(
  jsonObject: any,
  rootClassName: string = "RootClass"
): string {
  // Almacenamos en un array cada clase generada, para luego concatenarlas
  const classDefinitions: string[] = [];

  /**
   * Genera el código de una clase C# a partir de un objeto JS (JSON).
   * Si encuentra propiedades que son objetos o arrays, generará clases adicionales.
   *
   * @param obj - El objeto del cual crear la clase
   * @param className - Nombre de la clase
   * @returns Código C# de la clase generada.
   */
  function buildClass(obj: any, className: string): string {
    let csharpClass = `public class ${className}\n{\n`;

    // Recorremos cada clave de 'obj' para generar propiedades
    for (const key in obj) {
      const value = obj[key];

      // Decidimos el tipo C# adecuado
      if (isObject(value)) {
        // Es un objeto anidado
        const subClassName = capitalize(key);

        // Generamos la clase recursivamente y la añadimos a nuestra lista
        classDefinitions.push(buildClass(value, subClassName));

        // Creamos la propiedad en la clase padre
        csharpClass += `    public ${subClassName} ${capitalize(
          key
        )} { get; set; }\n`;
      } else if (Array.isArray(value)) {
        // Es un array
        if (value.length > 0 && isObject(value[0])) {
          // Array de objetos
          const subClassName = capitalize(key);
          // Generamos la clase en base al primer elemento
          classDefinitions.push(buildClass(value[0], subClassName));
          csharpClass += `    public List<${subClassName}> ${capitalize(
            key
          )} { get; set; }\n`;
        } else if (value.length > 0) {
          // Array de primitivos
          const elementType = mapCSharpType(value[0]);
          csharpClass += `    public List<${elementType}> ${capitalize(
            key
          )} { get; set; }\n`;
        } else {
          // Array vacío: no sabemos el tipo -> List<object> (o la que prefieras)
          csharpClass += `    public List<object> ${capitalize(
            key
          )} { get; set; }\n`;
        }
      } else {
        // Valor primitivo
        const propType = mapCSharpType(value);
        csharpClass += `    public ${propType} ${capitalize(
          key
        )} { get; set; }\n`;
      }
    }

    csharpClass += `}\n`;
    return csharpClass;
  }

  // Función auxiliar para capitalizar la primera letra y conservar el resto
  function capitalize(str: string): string {
    if (!str || typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Verifica si un valor es un objeto "plain" (ni null ni array)
  function isObject(value: any): boolean {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  // Mapea un valor primitivo de JS al tipo C# más adecuado (heurístico)
  function mapCSharpType(value: any): string {
    if (value === null || value === undefined) {
      // Podrías usar 'object', 'string', 'dynamic', etc. según prefieras
      return "object";
    }
    switch (typeof value) {
      case "string":
        return "string";
      case "number":
        // Podrías usar "int", "long", "double", "decimal" o "float"
        // según tus necesidades. Aquí optamos por "double".
        return "double";
      case "boolean":
        return "bool";
      default:
        // Otros tipos (symbol, function, etc.) -> 'object'
        return "object";
    }
  }

  // Generamos la clase raíz
  classDefinitions.push(buildClass(jsonObject, rootClassName));

  // Agregamos un "using" si queremos manejar listas
  // Podríamos añadir más usings si lo necesitamos
  let finalCode = `using System.Collections.Generic;\n\n`;

  // Concatenamos todas las clases (raíz y subclases) en un string
  finalCode += classDefinitions.join("\n") + "\n";

  return finalCode;
}
