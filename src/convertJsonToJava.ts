
/**
 * Convierte un JSON (objeto JS) en código Java.
 *
 * @param jsonObject - Objeto JSON parseado.
 * @param rootClassName - Nombre de la clase raíz que se generará.
 * @returns Un string con la definición de la(s) clase(s) Java.
 */
export function convertJsonToJava(jsonObject: any, rootClassName: string): string {
    // Aquí almacenaremos el código de todas las clases generadas
    const classDefinitions: string[] = [];

    /**
     * Función recursiva que construye la clase para un objeto dado.
     * @param obj - El objeto JSON del que se generará la clase.
     * @param className - Nombre de la clase que se generará.
     * @returns Retorna el string de la clase generada.
     */
    function buildClass(obj: any, className: string): string {
        let classStr = `public class ${capitalize(className)} {\n`;

        // Primero, generamos los campos (atributos) según cada clave de `obj`.
        for (const key in obj) {
            const value = obj[key];

            if (isObject(value)) {
                // Si es un objeto (y no un array), creamos una subclase
                const subClassName = capitalize(key);
                classStr += `    private ${subClassName} ${key};\n\n`;
                // Generamos recursivamente la subclase
                classDefinitions.push(buildClass(value, subClassName));
            } else if (Array.isArray(value)) {
                // Si es un array, hay que ver si es array de primitivos u objetos
                if (value.length > 0 && isObject(value[0])) {
                    // Array de objetos
                    const subClassName = capitalize(key);
                    classStr += `    private List<${subClassName}> ${key};\n\n`;
                    // Generamos la clase para el primer elemento (modelo)
                    classDefinitions.push(buildClass(value[0], subClassName));
                } else {
                    // Array de primitivos (string, number, boolean, etc.)
                    const primitiveType = mapPrimitiveType(value[0]);
                    classStr += `    private List<${primitiveType}> ${key};\n\n`;
                }
            } else {
                // Valor primitivo (string, number, boolean, null, etc.)
                const fieldType = mapPrimitiveType(value);
                classStr += `    private ${fieldType} ${key};\n\n`;
            }
        }

        // Generamos getters y setters
        for (const key in obj) {
            const value = obj[key];
            let fieldType = "";

            if (isObject(value)) {
                // Mismo nombre que la subclase
                fieldType = capitalize(key);
            } else if (Array.isArray(value)) {
                // Lista de algo
                if (value.length > 0 && isObject(value[0])) {
                    fieldType = `List<${capitalize(key)}>`;
                } else {
                    fieldType = `List<${mapPrimitiveType(value[0])}>`;
                }
            } else {
                // Primitivo
                fieldType = mapPrimitiveType(value);
            }

            const camelKey = capitalize(key);
            classStr += `    public ${fieldType} get${camelKey}() {\n`;
            classStr += `        return ${key};\n`;
            classStr += `    }\n\n`;

            classStr += `    public void set${camelKey}(${fieldType} ${key}) {\n`;
            classStr += `        this.${key} = ${key};\n`;
            classStr += `    }\n\n`;
        }

        classStr += `}\n`;
        return classStr;
    }

    // Función auxiliar para capitalizar la primera letra
    function capitalize(str: string): string {
        if (!str || typeof str !== "string") return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Función para saber si algo es un objeto (y no un array, null, etc.)
    function isObject(value: any): boolean {
        return value && typeof value === "object" && !Array.isArray(value);
    }

    // Mapea un valor primitivo de JS al tipo Java correspondiente
    function mapPrimitiveType(value: any): string {
        if (value == null) {
            // Podrías retornarlo como 'Object' o manejarlo de forma especial
            return "Object";
        }
        switch (typeof value) {
            case "string":
                return "String";
            case "number":
                // Podrías tener heurísticas más complejas (int vs double).
                return "double";
            case "boolean":
                return "boolean";
            default:
                // Cualquier otro caso lo tratamos como Object
                return "Object";
        }
    }

    // Generamos la clase raíz y almacenamos su definición
    classDefinitions.push(buildClass(jsonObject, rootClassName));

    // Como utilizamos `List<T>` en caso de arrays, sería buena idea
    // añadir el import correspondiente en la parte superior.
    // Unimos todas las clases en un único string.
    const finalCode = `
  import java.util.List;
  
  ${classDefinitions.join("\n")}
  `;

    return finalCode;
}