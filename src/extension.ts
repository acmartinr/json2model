// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "rulewatcher" is now active!');

  // Register a "Hello World" command
  const disposable = vscode.commands.registerCommand(
    "rulewatcher.helloWorld",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "holaMundo", // Identificador
        "Hola Mundo", // Título de la pestaña
        vscode.ViewColumn.One, // Dónde se abre
        {
          enableScripts: true, // Permitir JS
        }
      );

      // Contenido HTML de la interfaz gráfica
      panel.webview.html = getWebviewContent();
    }
  );

  // Comando principal: Convertir JSON
  const convertJsonCommand = vscode.commands.registerCommand(
    "rulewatcher.convertJson",
    async () => {
      const options = ["Java", "Python", "C#"];
      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: "Selecciona el lenguaje para convertir JSON",
      });

      if (selected) {
        await handleJsonConversion(selected);
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(convertJsonCommand);

  // Create a decoration type for unclosed tags
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255,0,0,0.3)",
  });

  // Función para manejar la conversión de JSON al lenguaje seleccionado
  async function handleJsonConversion(language: string) {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const jsonText = document.getText(selection);

      try {
        const jsonObject = JSON.parse(jsonText);
        let result = "";

        switch (language) {
          case "Java":
            result = convertJsonToJava(jsonObject, "GeneratedClass");
            break;
          case "Python":
            result = convertJsonToPython(jsonObject);
            break;
          case "C#":
            result = convertJsonToCSharp(jsonObject, "GeneratedClass");
            break;
        }

        const doc = await vscode.workspace.openTextDocument({
          content: result,
          language: language.toLowerCase(),
        });
        vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(
          "Error: El texto seleccionado no es un JSON válido."
        );
      }
    } else {
      vscode.window.showErrorMessage("No hay ningún editor activo.");
    }
  }

  // Función para convertir JSON a Python
  function convertJsonToPython(jsonObject: any): string {
    let pythonClass = `class GeneratedClass:\n`;
    for (const key in jsonObject) {
      pythonClass += `    ${key}: ${getPythonType(jsonObject[key])}\n`;
    }
    return pythonClass;
  }

  // Función para convertir JSON a C#
  function convertJsonToCSharp(jsonObject: any, className: string): string {
    let csharpClass = `public class ${className} {\n`;

    for (const key in jsonObject) {
      const value = jsonObject[key];
      const type = getCSharpType(value);
      const camelKey = key.charAt(0).toUpperCase() + key.slice(1);

      csharpClass += `    public ${type} ${camelKey} { get; set; }\n`;
    }

    csharpClass += `}`;
    return csharpClass;
  }
  // Register a listener for file edits within the workspace
  const fileEditWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (
      editor &&
      editor.document.uri.toString() === event.document.uri.toString()
    ) {
      const text = event.document.getText();
      const unclosedTags = findUnclosedTags(text);

      const decorations: vscode.DecorationOptions[] = [];
      unclosedTags.forEach((tag) => {
        const tagPattern = new RegExp(
          `<${tag}([^>]*)>(?![\s\S]*?<\/${tag}>)`,
          "g"
        );
        let match;
        while ((match = tagPattern.exec(text)) !== null) {
          const startPos = event.document.positionAt(match.index);
          const endPos = event.document.positionAt(
            match.index + match[0].length
          );
          decorations.push({ range: new vscode.Range(startPos, endPos) });
        }
      });

      // Apply decorations or clear them if no unclosed tags are found
      editor.setDecorations(decorationType, decorations);
    }
  });

  context.subscriptions.push(fileEditWatcher);
  context.subscriptions.push(decorationType);
}

function getWebviewContent() {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hola Mundo</title>
        </head>
        <body>
            <h1 style="text-align: center; font-family: Arial, sans-serif;">¡Hola Mundo!</h1>
            <p style="text-align: center;">Esto es una extensión de prueba con interfaz gráfica.</p>
        </body>
        </html>
    `;
}

// Function to find unclosed HTML tags
function findUnclosedTags(text: string): string[] {
  const tagPattern = /<([a-zA-Z0-9]+)(?=\s|>|$)(?![^<]*<\/\1>)/g;
  const unclosedTags: string[] = [];
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    unclosedTags.push(match[1]);
  }
  return unclosedTags;
}

/**
 * Convierte un JSON (objeto JS) en código Java.
 *
 * @param jsonObject - Objeto JSON parseado.
 * @param rootClassName - Nombre de la clase raíz que se generará.
 * @returns Un string con la definición de la(s) clase(s) Java.
 */
function convertJsonToJava(jsonObject: any, rootClassName: string): string {
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

// Función auxiliar para determinar el tipo Java
function getJavaType(value: any): string {
  if (typeof value === "string") {
    return "String";
  } else if (typeof value === "number") {
    return value % 1 === 0 ? "int" : "double";
  } else if (typeof value === "boolean") {
    return "boolean";
  } else if (Array.isArray(value)) {
    return "List<Object>";
  } else if (typeof value === "object") {
    return "Object";
  } else {
    return "String";
  }
}

// Función auxiliar para obtener el tipo Python
function getPythonType(value: any): string {
  if (typeof value === "string") return "str";
  if (typeof value === "number") return value % 1 === 0 ? "int" : "float"; // Corregido
  if (typeof value === "boolean") return "bool";
  if (Array.isArray(value)) return "list";
  if (typeof value === "object") return "dict";
  return "str";
}

// Función auxiliar para obtener el tipo C#
function getCSharpType(value: any): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return value % 1 === 0 ? "int" : "double";
  if (typeof value === "boolean") return "bool";
  if (Array.isArray(value)) return "List<object>";
  if (typeof value === "object") return "object";
  return "string";
}

// This method is called when your extension is deactivated
export function deactivate() {}
