$(document).ready(function() {
    const data = {
        NORRE: {
            SOV: { female: 22.1, male: 23.2 },
            STJ: { female: 19.4, male: 19.8 },
            AAO: { female: 21.1, male: 21.4 }
        },
        WASE: {
            SOV: {
                "18-40": { female: 22, male: 21.8 },
                "41-65": { female: 22.6, male: 23.2 },
                ">65": { female: 23.9, male: 24.3 }
            },
            STJ: {
                "18-40": { female: 19.2, male: 19 },
                "41-65": { female: 20.2, male: 20.7 },
                ">65": { female: 21, male: 21.7 }
            }
        }
    };

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

    function calculateULN(heightCm, study, site, gender, ageGroup) {
        console.log(heightCm, study, site, gender, ageGroup);
        if (study === "NORRE") {
            return ((heightCm / 100) * data[study][site][gender]).toFixed(1);
        } else if (study === "WASE" && site !== "AAO") {
            return ((heightCm / 100) * data[study][site][ageGroup][gender]).toFixed(1);
        }
        return "n/a";
    }

    function createTable(heightData, site, gender, ageGroup) {
        const headers = ['Height (cm)', 'Height (ft & in)', 'Height (in)', 'NORRE', 'WASE'];
        const rows = heightData.map(entry => {
            const ulnNORRE = calculateULN(entry.cm, 'NORRE', site, gender);
            const ulnWASE = calculateULN(entry.cm, 'WASE', site, gender, ageGroup);
            const ulnNORREDisplay = `${ulnNORRE} cm`; //ulnNORRE > 40 ? `${ulnNORRE} cm *` : `${ulnNORRE} cm`;
            const ulnWASEDisplay = `${ulnWASE} cm`; //ulnWASE > 40 ? `${ulnWASE} cm *` : `${ulnWASE}`;
            return `<tr>
                        <td>${entry.cm} cm</td>
                        <td>${entry.feet}' ${entry.inches}"</td>
                        <td>${(entry.cm / 2.54).toFixed(1)} in</td>
                        <td>${ulnNORREDisplay}</td>
                        <td>${ulnWASEDisplay}</td>
                    </tr>`;
        }).join('');
        return `
            <table>
                <thead>
                    <tr>
                        <th colspan="3">Height</th>
                        <th colspan="2">ULN (${site})</th>
                        
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

    $('#site').on('change', function() {
        const selectedSite = $(this).val();
        if (selectedSite === 'SOV' || selectedSite === 'STJ') {
            $('#ageGroup, #ageGroupLabel').show();
        } else {
            $('#ageGroup, #ageGroupLabel').hide();
        }
    });

    $('#aortaForm').on('submit', function(event) {
        event.preventDefault();
        const gender = $('#gender').val();
        const site = $('#site').val();
        const ageGroup = $('#ageGroup').val() || '18-40'; // default age group if not applicable
        const heightData = generateHeightData(140, 210);
        const resultsTable = createTable(heightData, site, gender, ageGroup);
        $('#resultsContainer').html(resultsTable);
        $('#resultsTitle').html(`Results: (${site})`);
        scrollToResults();
    });

    function scrollToResults() {
        const resultsSection = document.getElementById('results');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
