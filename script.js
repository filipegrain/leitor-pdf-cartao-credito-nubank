document.getElementById('pdfFileInput').addEventListener('change', handleFileSelect)

const TRANSACTIONS_PAGE_NUMBER = 4
const transactionPattern = /(\d{2} [A-Z]{3}[\s\S]+?)\s+(\d+,\d{2})/g
let extractedData = []
let totalValue = 0

function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = async function (e) {
        const pdfData = new Uint8Array(e.target.result)
        await extractTextFromPDF(pdfData)
    }

    reader.readAsArrayBuffer(file)
}

async function extractTextFromPDF(pdfData) {
    const pdf = await pdfjsLib.getDocument(pdfData).promise

    for (let pageNumber = TRANSACTIONS_PAGE_NUMBER; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const textContent = await page.getTextContent()

        if (textContent.items[0].str === 'TRANSAÇÕES') {
            textContent.items.splice(0, 5)
            const text = textContent.items.map((item) => item.str).join(' ')

            let match
            while ((match = transactionPattern.exec(text)) !== null) {
                const [, transactionInfo, value] = match
                const lines = transactionInfo.trim().split(/\n/)

                for (const line of lines) {
                    const [, date, name] = line.match(/^(\d{2} [A-Z]{3})\s+([\s\S]+?)$/)
                    const numericValue = parseFloat(value.replace('.', '').replace(',', '.'))
                    totalValue += numericValue

                    const edFoundSameTransaction = extractedData.find((ed) =>
                        compareWords(ed.name, name),
                    )
                    if (edFoundSameTransaction) {
                        edFoundSameTransaction.value += numericValue
                    } else {
                        extractedData.push({ date, name, value: numericValue })
                    }
                }
            }
        }
    }

    console.log(JSON.parse(JSON.stringify(extractedData)))
    document.getElementById('resultContainer').innerHTML = 'Total Fatura: ' + totalValue.toFixed(2)
    drawPieChart()
}

function compareWords(str1, str2) {
    // Remove non-alphanumeric characters and split the strings into arrays of words
    const words1 = str1.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)
    const words2 = str2.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)

    // Convert arrays to sets for efficient intersection check
    const set1 = new Set(words1)
    const set2 = new Set(words2)

    // Find the intersection of the two sets
    const intersection = [...set1].filter((word) => set2.has(word))

    // Check if there is at least one common word
    return intersection.length > 0
}

function drawPieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d')
    const labels = extractedData.map((ed) => ed.name)
    const data = extractedData.map((ed) => ed.value)
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: generateRandomColors(extractedData.length),
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
        },
    })
}

function generateRandomColors(count) {
    const colors = []
    for (let i = 0; i < count; i++) {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16)
        colors.push(color)
    }
    return colors
}
