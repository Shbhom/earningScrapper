import puppeteer from "puppeteer";
import fs from "fs/promises"
import path from "path";
import { exec } from "child_process"

(async () => {
    const browser = await puppeteer.launch({ headless: false });
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

            if (formattedDate === today) {
                const pdfLink = post.querySelector('.pdf-pill-link').getAttribute('href');
                if (pdfLink !== null) {
                    links.push(pdfLink);
                }
            }
        });

        let Names = [];

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
                Names.push(pdfName)
            }
        })

        return { links, Names };
    });

    const newPage = await browser.newPage()
    for (let i = 0; i < pdfData.links.length; i++) {
        let pdfUrl = pdfData.links[i]
        if (pdfUrl === 'null') {
            continue;
        }
        await newPage.goto(pdfUrl)

        if (i == 0) {
            await newPage.waitForSelector('#id_login')
            await newPage.type('#id_login', "haite.ku4897@gmail.com")
            await newPage.type('#id_password', "trendlyne")
            await newPage.click(".login-btn")
        }
        let url = newPage.url()

        let pdfName = ''
        pdfName = pdfData.Names[i].replace('&', 'and')

        if (!pdfName.endsWith('.')) {
            pdfName += '.'
        }

        let pdfPath = path.resolve(`./pdfs/${pdfName}pdf`)
        console.log(pdfPath)

        const curlCommand = `curl ${url} -o ${pdfPath}`;

        exec(curlCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }

            console.log(`curl command output:\n${stdout}`);
        });
        // https.get(url, response => {
        //     let pdfData = '';

        //     response.on('data', chunk => {
        //         pdfData += chunk;
        //     });
        //     console.log(pdfData);

        //     response.on('end', async () => {
        //         try {
        //             const command = new PutObjectCommand({
        //                 ContentType: 'application/pdf',
        //                 Bucket: 'pdfscrapper.bucket',
        //                 Body: pdfData,
        //                 Key: `${pdfName}pdf`
        //             });

        //             await s3.send(command);
        //             console.log('File uploaded successfully');
        //         } catch (error) {
        //             console.error('Error uploading file:', error);
        //         }
        //     });
        // });
    }

    await browser.close();

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
