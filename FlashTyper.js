function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const puppeteer = require('puppeteer-extra')
  const pluginStealth = require('puppeteer-extra-plugin-stealth')
  puppeteer.use(pluginStealth())

  const browser = await puppeteer.launch({ headless: false, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
  const newContext = await browser.createIncognitoBrowserContext()

  const page = await browser.newPage()

  await page.goto('https://thetypingcat.com/typing-speed-test/1m')

  await sleep(2000)

  //Gets the typing paragraph
  let element = await page.$("#body > div > div > div:nth-child(3) > div > div.styledComponents__ContentWrapper-sc-1vj1a5a-3.hXkFOq > div.styledComponents__Content-sc-1vj1a5a-0.dIhoFe > div.styledComponents__LaptopWrapper-sc-1vj1a5a-2.iCHJsM > div > div > div:nth-child(2) > div > div.screen.shadow > div > div.screen-display")
  let textGrabbed = await page.evaluate(el => el.textContent, element)

  //Cuts the extra text from the start of the string
  textGrabbed = textGrabbed.replace("AccuracySpeedTimeErrors100%0WPM0CPM60s0/0", "");

  //Types Random Key to start the typing test
  await page.keyboard.type("j")

  //Loops through every character captured
  for (var i=0; i< textGrabbed.length; i++){
      if (textGrabbed[i] != "⏎"){
        await page.keyboard.type(textGrabbed[i], {delay: 0})
      }else{
        await page.keyboard.press('Enter');
      }
  }
})()
