// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// Importa las funciones de conversión desde tus archivos .js
// (Ajusta las rutas si están en otra carpeta)
import { convertJsonToJava } from "./convertJsonToJava";
import { convertJsonToPython } from "./convertJsonToPython";
import { convertJsonToCSharp } from "./convertJsonToCSharp";

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
