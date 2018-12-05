const puppeteer = require('puppeteer');
const fs = require('fs');
var chalk = require('chalk');

const URLscraper = require("./URL_reader.js");
const scraper = require("./PGE_scraping.js")

var firstYear = 2009;
var currentYear = 2017;
var exception = 2011;

// -------------------------------------------------------------->>>
async function ScrapURLs() {                                            // Obteniento las URLs 
    let checkList = (currentYear - firstYear + 1) * 2;
    for (let year = firstYear; year <= currentYear; year++) {
        let yearSTR = `${year}`;
        if (year == exception) {                                        // Excepción
            checkList -= 2;
            console.log(chalk.red(`File for year ${year} with exception. [${checkList} files left]`));
            continue;
        }                                                               // El archivo para GASTOS ya existe
        if (fs.existsSync(`./server/data_sources/scraped_data/URLs/${year}_gastos_URLs.json`)) {
            checkList--;
            console.log(chalk.yellow(`File for year ${year} EXPENSES already exists. [${checkList} files left]`));
        } 
        else {                                                          // Crear archivo para GASTOS
            console.log(chalk.green(`
            Reading URLs for EXPENSES of year ${year}`));
            let expensesURLend = `N_${yearSTR.substring(2, 4)}_E_R_31`;

            let { nSections, nPrograms } = await URLscraper.URLreader(year, expensesURLend, "gastos");
            console.log(chalk.green(
                `URLs of year ${year} succesfully saved!
            Total Sections: ${nSections}  // Total Programs: ${nPrograms}`));
            checkList--;
        }                                                               // El archivo para INGRESOS ya existe
        if (fs.existsSync(`./server/data_sources/scraped_data/URLs/${year}_ingresos_URLs.json`)) {
            checkList--;
            console.log(chalk.yellow(`File for year ${year} INCOMES already exists. [${checkList} files left]`));
        }
        else {                                                          // Crear archivo para INGRESOS
            console.log(chalk.green(`
            Reading URLs for INCOMES of year ${year}`));
            let expensesURLend = `N_${yearSTR.substring(2, 4)}_E_R_2`;

            let { nSections, nPrograms } = await URLscraper.URLreader(year, expensesURLend, "ingresos");
            console.log(chalk.green(
                `URLs of year ${year} succesfully saved!
            Total Sections: ${nSections}  // Total Programs: ${nPrograms}`));
            checkList--;
        }  
    }
    console.log(checkList);

    if (checkList == 0) {
        console.log("All URLs available. Scrapping data...");
        await ScrapData();
        console.log(chalk.green("DONE!"));
    }
}
// -------------------------------------------------------------->>>

// -------------------------------------------------------------->>>
async function ScrapData() {             // Obteniendo los datos
    for (let year = 2014; year <= currentYear; year++) {
        if (year == exception) {
            console.log(chalk.red(`File for year ${year} with exception. [${checkList}]`));
            continue;
        }
        if (fs.existsSync(`./server/data_sources/scraped_data/Cleaned_data/${year}_gastos.json`)) {
            console.log(chalk.yellow(`File for year ${year} EXPENSESalready exists.`));
        } else {
            let message = await scraper.scrapingPGE(year, "gastos");
            console.log(chalk.green(message));
        }
        if (fs.existsSync(`./server/data_sources/scraped_data/Cleaned_data/${year}_ingresos.json`)) {
            console.log(chalk.yellow(`File for year ${year} INCOMES already exists.`));
        } else {
            let message = await scraper.scrapingPGE(year, "ingresos");
            console.log(chalk.green(message));
        }
    }
    return;
}
// -------------------------------------------------------------->>>


ScrapURLs();