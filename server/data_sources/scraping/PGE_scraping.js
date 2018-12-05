const puppeteer = require('puppeteer');
const fs = require('fs');
var chalk = require('chalk');

const scraperPGE = {};

scraperPGE.scrapingPGE = async (year, in_out) =>{  
    const browser = await puppeteer.launch();
    const page = await browser.newPage();                                                                   // Iniciar navegador
    console.log(`Scraping data for year ${year}...`);

    // Leer los datos del archivo
    let JSONfile = JSON.parse(fs.readFileSync(`./server/data_sources/scraped_data/URLs/${year}_${in_out}_URLs.json`, 'utf8'));
    let listComplete = new Object();

    var tabN = 5;
    if (year < 2014){ tabN = 7 }                                                                            // Corrección entre 2009 - 2013
    // -------------------------------------------------------------------------------------------------->>>
    if (in_out == "gastos"){
        console.log(`Expenses...`);
        for (let sectionIndex in JSONfile){             // Por sección
            listComplete[sectionIndex] = new Object();
            console.log(chalk.yellow(sectionIndex)," - "+ JSONfile[sectionIndex].name);
            for (let programIndex in JSONfile[sectionIndex].programs) {             // Por programa
                listComplete[sectionIndex][programIndex] = new Object();
                console.log("   " + chalk.yellow(programIndex)," - "+ JSONfile[sectionIndex].programs[programIndex].name);

                await page.goto(JSONfile[sectionIndex].programs[programIndex].url);                                         // Ir a la dirección
                
                listComplete[sectionIndex][programIndex] = await page.evaluate((tabN) => {                 
                    let dataTable = document.getElementsByTagName("table")[tabN].getElementsByTagName("tr");                // Tabla a arreglo  
                    let prevEntity = 1;
                    let dataTableObj = new Object();
                    
                    for (let row = 1; row < dataTable.length; row++) {                                                      // Identificación de entidades
                        let cellEntity = "";
                        if (dataTable[row].getElementsByTagName("td")[0].getElementsByTagName("div").length > 0){
                            cellEntity = dataTable[row].getElementsByTagName("td")[0].getElementsByTagName("div")[0].innerText;
                        }
                        if (cellEntity != "" || row == dataTable.length - 1){
                            
                            if (row > 1 || row == dataTable.length - 1){
                                let ent = "";
                                if (dataTable[prevEntity].getElementsByTagName("td")[0].getElementsByTagName("div").length > 0){
                                    ent = (dataTable[prevEntity].getElementsByTagName("td")[0].getElementsByTagName("div")[0].innerText).substring(3, 5);
                                }
                                dataTableObj[ent] = new Object();

                                for (let subRow = row - 1; subRow > prevEntity; subRow--) {
                                    let rowElements = dataTable[subRow].getElementsByTagName("td");
                                    let cellCode = "";                                                                      // Económica
                                    if (rowElements[1].getElementsByTagName("div").length > 0) {
                                        cellCode = rowElements[1].getElementsByTagName("div")[0].innerText;
                                    }               
                                    if (cellCode == "") {
                                        previousCode = "0";                                                                 // Sin información válida
                                        continue;
                                    }
                                    let cellQuantity = "";
                                    if (rowElements[4].getElementsByTagName("div").length > 0){
                                        if (rowElements[3].getElementsByTagName("div")[0].innerText == "") {                // Total
                                            cellQuantity = parseFloat(rowElements[4].getElementsByTagName("div")[0].innerText.replace(".", "").replace(",", "."));
                                        } else {
                                            cellQuantity = parseFloat(rowElements[3].getElementsByTagName("div")[0].innerText.replace(".", "").replace(",", "."));
                                        }
                                    }
                                    if (parseInt(cellCode) < 10 && cellQuantity == "") {                                    // Grupos de gasto sin asignación
                                        previousCode = (toString(cellCode));
                                        continue;
                                    }
                                    let cellText = "";                                                                      // Explicación de la transacción
                                    if (rowElements[2].getElementsByTagName("div").length > 0){
                                        cellText = rowElements[2].getElementsByTagName("div")[0].innerText;
                                    }
                                    if ((toString(cellCode)) == previousCode.substring(0, previousCode.length - 1) ||       // Filtro
                                    (toString(cellCode)) == previousCode.substring(0, previousCode.length - 2)) {
                                        previousCode = toString(cellCode);
                                        continue;
                                    }
                                    dataTableObj[ent][cellCode] = new Array(2);
                                    dataTableObj[ent][cellCode][0] = cellQuantity;                                          // Guardar transacción
                                    dataTableObj[ent][cellCode][1] = cellText;                               
                                    previousCode = (toString(cellCode));                                                    // Guardar prev. para prox. iteración         
                                };
                                prevEntity = row;
                            };
                        };
                    };
                    return dataTableObj;

                }, tabN).catch(async (err) => {
                    console.error(chalk.red(`    ERROR Scraping "${JSONfile[sectionIndex].name}" > "${JSONfile[sectionIndex].programs[programIndex].name}" \n`),
                                  chalk.red(`    URL: ${JSONfile[sectionIndex].programs[programIndex].url} // `));
                    await browser.close();
                    throw err;
                });   
            };
        };
    }; 
    // -------------------------------------------------------------------------------------------------->>>
    if (in_out == "ingresos"){
        console.log(`Incomes...`);
        for (let entityIndex in JSONfile){      // Por entidad
            console.log(chalk.yellow(entityIndex));
            listComplete[entityIndex] = new Object();
            for (let sectionIndex in JSONfile[entityIndex]){        // Por sección
                console.log("   ",chalk.yellow(sectionIndex)," - " + JSONfile[entityIndex][sectionIndex].name);
                listComplete[entityIndex][sectionIndex] = new Object();
                for (let organIndex in JSONfile[entityIndex][sectionIndex].organisims){     // Por organismo
                    console.log("      ",chalk.yellow(organIndex)," - "+ JSONfile[entityIndex][sectionIndex].organisims[organIndex].name);

                    await page.goto(JSONfile[entityIndex][sectionIndex].organisims[organIndex].url);                // Ir a la dirección

                    listComplete[entityIndex][sectionIndex][organIndex] = await page.evaluate((tabN) => {
                        let dataTable = document.getElementsByTagName("table")[tabN].getElementsByTagName("tr");       // Tabla a arreglo

                        let dataTableObj = new Object();
                        var previousCode = "0";

                        for (let row = dataTable.length-1; row > 1; row--) {
                            let rowElements = dataTable[row].getElementsByTagName("td");
                            let cellCode = rowElements[0].getElementsByTagName("div")[0].innerText;                 // Económica
                            if (cellCode == "") { 
                                previousCode = "0";                                                                 // Sin información válida
                                continue;
                            }
                            if (rowElements[2].getElementsByTagName("div")[0].innerText == "") {                    // Total
                                var cellQuantity = parseFloat(rowElements[3].getElementsByTagName("div")[0]
                                .innerText.replace(".", "").replace(",", "."));
                            } else {
                                var cellQuantity = parseFloat(rowElements[2].getElementsByTagName("div")[0]
                                .innerText.replace(".", "").replace(",", "."));
                            }
                            if (parseInt(cellCode) < 10 && 
                                rowElements[3].getElementsByTagName("div")[0].innerText ==""){                      // Grupos de gasto sin asignación
                                previousCode = (toString(cellCode));
                                continue;
                            }
                            let cellText = rowElements[1].getElementsByTagName("div")[0].innerText;                 // Explicación de la transacción
                            if ((toString(cellCode)) == previousCode.substring(0, previousCode.length - 1) ||       // Filtro
                                (toString(cellCode)) == previousCode.substring(0, previousCode.length - 2)){       
                                previousCode = toString(cellCode);
                                continue;   
                            }   
                            dataTableObj[cellCode] = [cellQuantity, cellText]                                       // Guardar transacción
                            previousCode = (toString(cellCode));                                                    // Guardar prev. para prox. iteración         
                        };
                        return dataTableObj;

                    }, tabN).catch(async(err) => {
                        console.error(chalk.red(`    ERROR Scraping "${JSONfile[entityIndex][sectionIndex].name}" > "${JSONfile[entityIndex][sectionIndex].organisims[organIndex].name}" \n`),
                                      chalk.red(`    URL: ${JSONfile[entityIndex][sectionIndex].organisims[organIndex].url} // `));
                        await browser.close();
                        throw err;
                    });
                };
            };
        };
    };
    // -------------------------------------------------------------------------------------------------->>>

    let root = "./server/data_sources/scraped_data/Cleaned_data"        // Borrar archivo previo si existe
    let outputFileName = `${root}/${year}_${in_out}.json`;
    if (fs.existsSync(outputFileName)) {
        fs.unlink(outputFileName, (err) => {
            if (err) throw err;
        });
    }
    let JSONdata = JSON.stringify(listComplete);                        // Escribir en el archivo
    fs.appendFile(outputFileName, JSONdata, (err) => {
        if (err) throw err;
    });
    await browser.close();                                              // Cerrar navegador
};
// -------------------------------------------------------------------------------------------------->>>

function checkItem(item) {
    if (item.length > 0) {
        return item[0].innerText;
    } else {
        return "";
    }
};

module.exports = scraperPGE;