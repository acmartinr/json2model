/**
 * Limpia o formatea un texto que debería ser JSON, pero puede tener:
 *   - Comillas simples en vez de dobles
 *   - Comas al final de objetos/arrays (trailing commas)
 * 
 * @param rawJson Texto bruto que se supone sea JSON
 * @returns Texto JSON "limpiado" listo para parsear
 */
export function cleanJsonString(rawJson: string): string {
    let cleaned = rawJson;
  
    // 1) Cambiar comillas simples por dobles
    //    Esto es un enfoque naive: reemplaza absolutamente *todas* las comillas simples.
    //    Si tienes strings que incluyen comillas simples internas, podrían alterarse.
    cleaned = cleaned.replace(/'/g, '"');
  
    // 2) Eliminar trailing commas antes de un cierre de objeto '}' o array ']'
    //    Regex que busca una coma seguida de espacios (opcional) y luego un '}' o ']'.
    //    Ejemplo: "clave": "valor",} -> "clave": "valor"}
    //             "clave": "valor",] -> "clave": "valor"]
    cleaned = cleaned.replace(/,(?=\s*[}\]])/g, "");
  
    // Si deseas hacer más limpiezas (quitar comentarios, etc.), agrégalas aquí
  
    return cleaned;
  }