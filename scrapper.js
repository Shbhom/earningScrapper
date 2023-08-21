import puppeteer from "puppeteer";
import fs from "fs/promises"
import path from "path";

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', consoleMessage => {
        console.log(`${consoleMessage.text()}`);
    });

    await page.goto('https://trendlyne.com/conference-calls/');
    await autoScroll(page);
    await page.waitForSelector('#allposts');

    const pdfData = await page.evaluate(async () => {
        const posts = document.querySelectorAll('#allposts .panel-post');
        const links = [];
        let today = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        today = new Intl.DateTimeFormat('en-US', options).format(today);
        today = 'Aug 21, 2023'


        posts.forEach(post => {
            const postDateText = post.querySelector('.post-head-subtext span:first-child').textContent.trim();
            const dateParts = postDateText.split(' ');
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2].replace(',', '');
            const formattedDate = `${month} ${day}, ${year}`;
            // console.log(formattedDate);

            if (formattedDate === today) {
                const pdfLink = post.querySelector('.pdf-pill-link').getAttribute('href');
                if (pdfLink !== null) {
                    links.push(pdfLink);
                }
            }
        });

        let pdfNames = [];

        posts.forEach(post => {
            const postDateText = post.querySelector('.post-head-subtext span:first-child').textContent.trim();
            const dateParts = postDateText.split(' ');
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2].replace(',', '');
            const formattedDate = `${month} ${day}, ${year}`;

            if (formattedDate === today) {
                let pdfName = post.querySelector('.post-head-text a').textContent
                pdfName = pdfName.replace(/\s/g, '_')
                pdfNames.push(pdfName)
            }
        })

        return { links, pdfNames };
    });

    let scrapedData = ''
    for (let i = 0; i < pdfData.links.length; i++) {
        scrapedData += `${pdfData.links[i]} : ${pdfData.pdfNames[i]}\n`
    }
    await browser.close();
    await fs.writeFile('./scraped_data.txt', scrapedData).then(() => { console.log(`data written to scraped_data.txt`) })
})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 100;
            const interval = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    });
}
