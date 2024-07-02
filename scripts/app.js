$(document).ready(function() {
    const data = {
        NORRE: {
        SOV: { female: 22.1, male: 23.2 },
        STJ: { female: 19.4, male: 19.8 },
        AAO: { female: 21.1, male: 21.4 }
        },
        WASE: {
            SOV: {
                "18-40": {female: 22, male: 21.8},
                "41-65": {female: 22.6, male: 23.2},
                ">65": {female: 23.9, male: 24.3}
            },
            STJ : {
            "18-40": {female: 19.2, male: 19},
            "41-65": {female: 20.2, male: 20.7},
            ">65": {female: 21, male: 21.7}
            }
        },
    }
    

    function generateHeightData(startCm, endCm) {
        const heightData = [];
        for (let cm = startCm; cm <= endCm; cm += 1) {
            const inches = cm / 2.54;
            const feet = Math.floor(inches / 12);
            const remainingInches = inches % 12;
            heightData.push({
                cm: cm,
                feet: feet,
                inches: remainingInches.toFixed(0)
            });
        }
        return heightData;
    }

    function calculateULN(heightCm, site, gender) {
        return ((heightCm / 100) * data[site][gender]).toFixed(1);
    }

    function createTable(heightData, site, gender) {
        const headers = ['Height (cm)', 'Height (ft & in)', 'Height (in)', 'ULN'];
        const rows = heightData.map(entry => {
            const uln = calculateULN(entry.cm, site, gender);
            const ulnDisplay = uln > 40 ? `${uln} cm *` : `${uln} cm`;
            return `<tr>
                        <td>${entry.cm} cm</td>
                        <td>${entry.feet}' ${entry.inches}"</td>
                        <td>${(entry.cm / 2.54).toFixed(1)} in</td>
                        <td>${ulnDisplay}</td>
                    </tr>`;
        }).join('');
        return `
            <table>
                <thead>
                    <tr>
                        <th colspan="3">Height</th>
                        <th>ULN (${site})</th>
                    </tr>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function scrollToResults() {
        const resultsSection = document.getElementById('results');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    $('#aortaForm').on('submit', function(event) {
        event.preventDefault();
        const gender = $('#gender').val();
        const site = $('#site').val();
        const heightData = generateHeightData(140, 210);
        const resultsTable = createTable(heightData, site, gender);
        $('#resultsContainer').html(resultsTable);
        scrollToResults();
    });
});
