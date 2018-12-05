const puppeteer = require('puppeteer');
const fs = require('fs');

const URLscraper = {};

URLscraper.URLreader = async (year, mainRoute, in_out) =>{
    // Iniciar navegador
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const rootSite = ('http://www.sepg.pap.hacienda.gob.es/Presup/')

    // Ir a la dirección
    await page.goto(`${rootSite}/PGE${year}Ley/MaestroDocumentos/PGE-ROM/${mainRoute}.htm`)
    
    // Direcciones de las secciones

    let mainList = await page.evaluate(() => {
        let mainTable = document.getElementsByTagName("table")[4].getElementsByTagName("tr");
        let adressArray = new Array(mainTable.length);
        for (let row = 0; row < mainTable.length; row++){
            let link = mainTable[row].getElementsByTagName("td")[1].getElementsByTagName("a")[0];
            let title = link.getElementsByTagName("font")[0].innerText;
            adressArray[row] = [title, link.href];
        }
        return adressArray;
    }).catch(async (err) => {
        console.error(chalk.red(`    ERROR Scraping "Main directory" \n`),
                      chalk.red(`    URL: ${rootSite}/PGE${year}Ley/MaestroDocumentos/PGE-ROM/${mainRoute}.htm // `));
        await browser.close();
        throw err;
    }); 

    let totalOfPrograms = 0;
    let totalOfSections = 0;
    var JSONdata = new Object()

    if (in_out == "gastos"){    // --------------------------------------------------------- GASTOS
        console.log(`${mainList.length} Sections found for year ${year}...`);
    
        // Direcciones de los programas
        for (let section in mainList){
    
            // Enrutamiento con excepción de Seguridad social
            let site = "";
            if (mainList[section][0].includes("Sección 60")){
                site = (mainList[section][1]).replace("1.htm", "1_G_1_1.htm");
            } else {
                site = (mainList[section][1]).replace("1.htm", "1_1_1.htm");
            }
            await page.goto(site);
  
            let result = await page.evaluate(() => {
                let mainTable = document.getElementsByTagName("table")[4].getElementsByTagName("tr");
                let programArray = new Array(mainTable.length/2);
                for (let row = 0; row < mainTable.length; row+=2) {
                    let rowCurrentAnchors = mainTable[row].getElementsByTagName("td")[1].getElementsByTagName("a");
                    let title = rowCurrentAnchors[0].getElementsByTagName("font")[0].innerText;
                    programArray[row/2] = { programName: title, programHTM: rowCurrentAnchors[1].href};
                }
                return { numberOfPrograms: (mainTable.length)/2, programs: programArray };
            }).catch(async (err) => {
                console.error(chalk.red(`    ERROR Scraping "${mainList[section]}" \n`),
                              chalk.red(`    URL: ${site} // `));
                await browser.close();
                throw err;
            }); 

            let { numberOfPrograms, programs } = result

            totalOfPrograms += numberOfPrograms;
    
            let programObj = new Object();
            for (let prog in programs) {
                let progName = programs[prog].programName
                programObj[(progName).substring(9, 13)] = {
                    name: (progName).substring(15, progName.length),
                    url: programs[prog].programHTM}
            }
            mainList[section][0] = {
                section: (mainList[section][0]).substring(8, 10),
                name: (mainList[section][0]).substring(12, mainList[section][0].length)};
            mainList[section][1] = programObj;
        }
        //JSONify
        for (let section in mainList){
            let sectionInfo = new Object();
            sectionInfo["name"] = mainList[section][0].name;
            sectionInfo["programs"] = mainList[section][1]
            JSONdata[mainList[section][0].section] = sectionInfo;
        }
// -------------------------------------------------------------------------------------------------
    } else if (in_out == "ingresos") { // ------------------------------------------------- INGRESOS
        console.log(`${mainList.length} Entities found for year ${year}...`);

        
        for (let entity in mainList) {
            let site = (mainList[entity][1]).replace("1.htm", "1_2.htm")

            await page.goto(site);    // Enrutamiento

            let subList = await page.evaluate(() => {
                let mainTable = document.getElementsByTagName("table")[4].getElementsByTagName("tr");
                let adressArray = new Array(mainTable.length);
                for (let row = 0; row < mainTable.length; row++) {
                    let link = mainTable[row].getElementsByTagName("td")[1].getElementsByTagName("a")[0];
                    let title = link.getElementsByTagName("font")[0].innerText;
                    adressArray[row] = [title, link.href];
                }
                return adressArray;
            }).catch(async (err) => {
                console.error(chalk.red(`    ERROR Scraping "${mainList[entity]}" \n`),
                              chalk.red(`    URL: ${site} // `));
                await browser.close();
                throw err;
            }); 

            let sect = JSONdata[mainList[entity][0]] = new Object()
            for (let section in subList){
                totalOfSections++
                sect[(subList[section][0]).substring(8, 10)] = { name: (subList[section][0]).substring(12, subList[section][0].length), organisims: subList[section][1]};
            }
        }
        console.log(`${totalOfSections} Sections found for year ${year}...`);

        for (let main in JSONdata){
            for (let sect in JSONdata[main]){

                await page.goto(JSONdata[main][sect].organisims);

                let result = await page.evaluate(() => {
                        let mainTable = document.getElementsByTagName("table")[4].getElementsByTagName("tr");
                        let newOrg = new Object();
                        for (let row = 0; row < mainTable.length - 2; row ++) {
                            let rowCurrentAnchors = mainTable[row].getElementsByTagName("td")[1].getElementsByTagName("a");
                            let title = rowCurrentAnchors[0].getElementsByTagName("font")[0].innerText;
                            newOrg[title.substring(10, 14).replace(".", "")] = { 
                                name: title.substring(15, title.length), 
                                url: rowCurrentAnchors[1].href }
                        }
                        return { numberOfOrganisims: mainTable.length - 2, org: newOrg };
                }).catch(async (err) => {
                    console.error(chalk.red(`    ERROR Scraping "${JSONdata[main]}" > "${JSONdata[main][sect]}" \n`),
                                  chalk.red(`    URL: ${JSONdata[main][sect].organisims} // `));
                    await browser.close();
                    throw err;
                }); 

                let { numberOfOrganisims, org } = result
                totalOfOrganisims += numberOfOrganisims;

                JSONdata[main][sect].organisims = org;
            }
        }
        console.log(`${totalOfSections} Organisims found for year ${year}...`);
    }
    // Escribir archivo
    writeFile(JSONdata, year, in_out);

    // Cerrar navegador
    await browser.close();
    return { 
        nSections: mainList.length, 
        nPrograms: totalOfPrograms
    }
}

// ---------------------------------------------------------------------------------------------->>>
async function writeFile(data, year, type) {                             // Escribir en el archivo
    let root = "./server/data_sources/scraped_data/URLs";
    if (fs.existsSync(`${root}/${year}_${type}_URLs.json`)) {
        fs.unlink(`${root}/${year}_${type}_URLs.json`, (err) => {
            if (err) throw err;
        })
    }
    let outputFileName = `${root}/${year}_${type}_URLs.json`;
    fs.appendFileSync(outputFileName, JSON.stringify(data));
    return;
}
// ---------------------------------------------------------------------------------------------->>>

module.exports = URLscraper;

