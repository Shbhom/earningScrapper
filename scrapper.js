import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto('https://trendlyne.com/conference-calls/');
    await autoScroll(page);
    await page.waitForSelector('#allposts');

    const pdfLinks = await page.evaluate(() => {
        const posts = document.querySelectorAll('#allposts .panel-post');
        const links = [];
        let today = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        today = new Intl.DateTimeFormat('en-US', options).format(today);


        const postdates = [];

        posts.forEach(post => {
            const postDateText = post.querySelector('.post-head-subtext span:first-child').textContent.trim();
            const dateParts = postDateText.split(' ');
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2].replace(',', ''); // Remove the comma
            const formattedDate = `${month} ${day}, ${year}`;

            postdates.push(formattedDate);

            if (formattedDate === today) {
                const pdfLink = post.querySelector('.pdf-pill-link').getAttribute('href');
                links.push(pdfLink);
            }
        });

        return { links };
    });

    let scrapedData = ''
    for (let i = 0; i < pdfLinks.links.length; i++) {
        scrapedData += `${pdfLinks.links[i]}\n`
    }


    await browser.close();
    console.log(scrapedData)
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
