document
    .getElementById('pdfFileInput')
    .addEventListener('change', handleFileSelect)

const TRANSACTIONS_PAGE_NUMBER = 4
const extractedData = []
let totalValue = 0

function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = function (e) {
        const pdfData = new Uint8Array(e.target.result)
        extractTextFromPDF(pdfData)
    }

    reader.readAsArrayBuffer(file)
    drawPieChart()
}

function extractTextFromPDF(pdfData) {
    const transactionPattern = /(\d{2} [A-Z]{3}[\s\S]+?)\s+(\d+,\d{2})/g
    pdfjsLib.getDocument(pdfData).promise.then(function (pdf) {
        for (
            let pageNumber = TRANSACTIONS_PAGE_NUMBER;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            pdf.getPage(pageNumber).then(function (page) {
                page.getTextContent().then(function (textContent) {
                    const tituloPagina = textContent.items[0].str
                    if (tituloPagina === 'TRANSAÇÕES') {
                        textContent.items.splice(0, 5)
                        const pageText = textContent.items
                            .map((item) => item.str)
                            .join(' ')

                        let match
                        while (
                            (match = transactionPattern.exec(pageText)) !== null
                        ) {
                            const [, transactionInfo, value] = match
                            const lines = transactionInfo.trim().split(/\n/)
                            for (const line of lines) {
                                const [, date, name] = line.match(
                                    /^(\d{2} [A-Z]{3})\s+([\s\S]+?)$/,
                                )
                                const numericValue = parseFloat(
                                    value.replace('.', '').replace(',', '.'),
                                )
                                totalValue += numericValue

                                const regex = new RegExp(name)
                                const edFoundSameTransaction =
                                    extractedData.find((ed) => {
                                        return regex.test(ed.name)
                                    })
                                if (edFoundSameTransaction) {
                                    edFoundSameTransaction.value += numericValue
                                } else {
                                    extractedData.push({
                                        date,
                                        name,
                                        value: numericValue,
                                    })
                                }
                            }
                        }
                    }
                })
            })
        }
    })
}

function drawPieChart() {
    document.getElementById('resultContainer').innerHTML =
        'Total Fatura: ' + totalValue
    const ctx = document.getElementById('pieChart').getContext('2d')
    const labels = extractedData.map((ed) => ed.name)
    const data = extractedData.map((ed) => ed.value)
    const pieChart = new Chart(ctx, {
        type: 'pie',
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
            responsive: true,
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
