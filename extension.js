/*
*
*	Crea nuevo codigo en cualquier lenguaje, refactoriza, comenta, debuggea, crea proyectos con
*	secuencias de comandos en terminal, y obten feedback con chatGPT.
*
*/


const vscode = require('vscode');
const os = require('os');
const { Configuration, OpenAIApi } = require("openai");

function generatePrompt(prompt) {
	return `${prompt[0].toUpperCase() + prompt.slice(1).toLowerCase()}`;
}

async function openaiCon(prompt, max_tokens) {
    const configuration = new Configuration({
        apiKey,
    });
    const openai = new OpenAIApi(configuration);
    try {
        const completion = await openai.createCompletion({
			model: "text-davinci-003",
			prompt,
			temperature: 0.2,
			max_tokens,
		});
        return completion.data.choices[0].text;
    } catch (error) {
        console.log(error);
        throw new Error(`OpenAI request failed with status code ${error.response.status}`);
    }
}

function activate(context) {

	console.log('Congratulations, your extension "iassistance" is now active!');

	let disposables = [
		vscode.commands.registerCommand('iassistance.Refactor', async function () {
			vscode.window.showQuickPick(["Opción 1", "Opción 2", "Opción 3"]).then((opcion) => {
				if (opcion) {
				vscode.window.showInformationMessage("Has seleccionado: " + opcion);
				}
			});
		}),
		
		vscode.commands.registerCommand('iassistance.IAssistance', async function () {

        const editor = vscode.window.activeTextEditor;
		let res = await vscode.window.showInputBox();

		const document = editor.document;
		const selection = editor.selection;
		let code = document.getText();
		try {
			if(res.substring(0,2) == "-R"){
				// Refactor
				if (editor) {
					let range;
					if(!selection.isEmpty){
						code = document.getText(selection);
						range = new vscode.Range(selection.start, selection.end);
					}else{
						range = new vscode.Range(0, 0, document.lineCount, 0); 
					}

					let prompt = generatePrompt("MUESTRA SOLO CODIGO, ES OBLIGATORIO QUE INCLUYAS TODO EL CODIGO ORIGINAL MENOS EL QUE TIENES QUE CAMBIAR, Refactoriza y Arregla este codigo FIJATE INCLUSO EN LOS PEQUEÑOS DETALLES: "+code+" TEN EN CUENTA QUE DEBERAS: "+res+".");
					const result = await openaiCon(prompt, 2048);


					editor.edit(editBuilder => {
						editBuilder.replace(range, result);
					})
					const explainPrompt = generatePrompt("No te extiendas en la respuesta mas de 150 tokens, ¿Que hay diferente entre este codigo y el otro? Codigo anterior: "+code+". Codigo nuevo: "+result);
					const explain = await openaiCon(explainPrompt, 150);
					vscode.window.showInformationMessage(`IAssistance: ${explain}`);
				} else {
					vscode.window.showErrorMessage('No se ha abierto un archivo');
				}
			}else if(res.substring(0,2) == "-C"){
				// Comment
				if (editor) {
					if(!selection.isEmpty) code = document.getText(selection);

					let prompt = generatePrompt("MUESTRA SOLO EL CODIGO y COMENTARIOS, NO USES NINGUN TOKEN PARA NADA QUE NO SEA CODIGO NI COMENTARIOS, Comenta este codigo: "+code+". RECUERDA: Incluye todo el codigo original, "+res.substring(2)+".");
					const result = await openaiCon(prompt, 2048);
					let range;

					if(!selection.isEmpty){
						range = new vscode.Range(selection.start, selection.end);
					}else{
						range = new vscode.Range(0, 0, document.lineCount, 0); 
					}

					editor.edit(editBuilder => {
						editBuilder.replace(range, result);
					})
				} else {
					vscode.window.showErrorMessage('No se ha abierto un archivo');
				}
			}else if(res.substring(0,2) == "-D"){
				// Debug
			}else if(res.substring(0,2) == "-I"){
				// Secuencias de comandos
				/**
				 * Se recomienda poner la shell que se quiere
				 */
				let prompt = generatePrompt('MUESTRA SOLO LO QUE PIDO, NO USES NINGÚN TOKEN PARA NADA QUE NO SEA LO QUE PIDO. \
				¿Qué lista de comandos se deben ejecutar en orden para (hacerlo todo en una nueva carpeta): '+res.substring(2)+'? \
				LO QUE PIDO: \
				1. Separa los comandos con punto y coma (;). \
				2. Utiliza opciones. Por ejemplo, usa -y en npm init -y. \
				3. Pon nombres con sentido a los archivos y carpetas. \
				4. Si tienes que crear un archivo package.json, asegúrate de que ningún comando anterior o posterior lo cree.'); 
				//5. Que el ultimo comando inicie la aplicacion, node no es npm start sino node index.js');
				let result = await openaiCon(prompt, 1000);

				let prompt2 = generatePrompt('Devuelve unicamente los comandos con los cambios aplicados pero respetando el formato. NO USES NINGÚN TOKEN PARA NADA QUE NO SEA LO QUE PIDO.  \
				Aplica lo que pido: '+result+' \
				LO QUE PIDO: \
				1. Utiliza el comando New-Item en vez de touch \
				2. Recuerda que cuando utlizas un comando de un framework como react, vite, next no hay que crear un package.json \
				3. Si hay algun comando mal, corrigelo \
				5. No pongas un punto al final \
				6. No pongas nada que no sean comandos ni comentarios ni nada ');
				let result2 = await openaiCon(prompt2, 1000);

				let commands = result2.split(';');
				
				const terminal = vscode.window.createTerminal();

				for (let i = 0; i < commands.length; i++) {
				  const command = commands[i].trim();
				  console.log(command);
				  terminal.sendText(command);
				}

				let prompt_ = generatePrompt("Solo un resumen, no vayas comando por comando ¿Que hacen estos comandos? "+commands);
				let result_ = await openaiCon(prompt_, 200);
				vscode.window.showInformationMessage('IAssistance: '+result_);

			}else if(res.substring(0,2) == "-F"){
				// Preguntar cualquier cosa teniendo como contexto el codigo
				if(!selection.isEmpty) code = document.getText(selection);
				let prompt = generatePrompt("cuentame, "+res.substring(2)+". CONTEXTO: "+code);
				const result = await openaiCon(prompt, 200);
				vscode.window.showInformationMessage('IAssistance: '+result);
			}else if(res.substring(0,2) == "-H"){
				// Off-Topic puedes preguntar cualquier cosa
				let prompt = generatePrompt(res.substring(2));
				const result = await openaiCon(prompt, 200);
				vscode.window.showInformationMessage('IAssistance: '+result);
			}else{
				// Añadir codigo al final
				const prompt = generatePrompt("MUESTRA SOLO EL CODIGO, NO USES NINGUN TOKEN PARA NADA QUE NO SEA CODIGO, CONTEXTO: "+code+" PETICION: "+res+". (No autocompletes esto) "+editor.document.languageId);
				const result = await openaiCon(prompt, 2048);
		
				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				const position = new vscode.Position(editor.document.lineCount - 1, lastLine.range.end.character);
				editor.edit(editBuilder => {
					editBuilder.insert(position, result);
				})

				const explainPrompt = generatePrompt("Hablame sobre este codigo, no te extiendas mas de 150 tokens: "+result);
				const explain = await openaiCon(explainPrompt, 150);
	
				vscode.window.showInformationMessage(`IAssistance: ${explain}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error.message}`);
		}
	})];

	//context.subscriptions.push(disposable);
	context.subscriptions.push(...disposables);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}