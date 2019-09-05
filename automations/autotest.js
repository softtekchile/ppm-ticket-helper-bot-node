'use strict'
var pw = "Softtek.2019";
var puppeteer = require('puppeteer');

var automationTest =  async function(ticketData){
    const browser = await puppeteer.launch({
        headless: false
      });
    const page = await browser.newPage();
    await page.goto('https://ppm.softtek.com/itg/web/knta/global/Logon.jsp');
    await page.waitForSelector('input[name="USERNAME"]');
    await page.type('input[name="USERNAME"]', ticketData.assignedTo);
    await page.type('input[name="PASSWORD"]', pw);
    await page.click('div[id="label-LOGON_SUBMIT_BUTTON_CAPTION"]');
    await page.waitForNavigation();
    await page.goto('https://ppm.softtek.com/itg/web/knta/crt/RequestCreate.jsp?REQUEST_TYPE_CREATE=5.35.30691.Application+Maintenance+and+Support');
    
    await page.waitForSelector('input[name="CH_1"]');
    await page.type('input[name="CH_1"]', ticketData.wbs);
    await page.waitFor(2000);
    await page.type('input[name="CH_28"]', ticketData.orgUnit);
    await page.type('input[name="ASSIGNED_TO_USER_ID"]', ticketData.assignedTo);
    await page.type('input[name="CH_3"]', ticketData.requirementType);
    await page.waitFor(2000);
    await page.type('input[name="DESCRIPTION"]', ticketData.description);
    await page.type('input[name="CH_14"]', ticketData.impact);
    await page.waitFor(1000);
    await page.type('input[name="CH_15"]', ticketData.urgency);
    await page.type('input[name="CH_4"]', ticketData.reason);

    const title = await page.title()
    console.log(title)
    //await browser.close();
    return 3;
}

module.exports.automationTest = automationTest;