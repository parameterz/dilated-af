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

    function convertHeightToCm(feet, inches) {
        return (feet * 30.48) + (inches * 2.54);
    }

    function getHeightCm() {
        const heightCm = parseFloat($('#heightCm').val());
        const heightFeet = parseInt($('#heightFeet').val());
        const heightInches = parseInt($('#heightInches').val());
        if (!isNaN(heightCm)) {
            return heightCm;
        } else if (!isNaN(heightFeet) && !isNaN(heightInches)) {
            return convertHeightToCm(heightFeet, heightInches);
        }
        return null;
    }

    function calculateULN(heightCm, study, site, gender, ageGroup) {
        if (study === "NORRE") {
            return ((heightCm / 100) * data[study][site][gender]).toFixed(1);
        } else if (study === "WASE" && site !== "AAO") {
            return ((heightCm / 100) * data[study][site][ageGroup][gender]).toFixed(1);
        }
        return "n/a";
    }

    function createResultsTable(heightCm, gender, ageGroup) {
        const headers = ['Site', 'ULN (NORRE)', 'ULN (WASE)'];
        const sites = ['SOV', 'STJ', 'AAO'];
        const rows = sites.map(site => {
            const ulnNORRE = calculateULN(heightCm, 'NORRE', site, gender);
            const ulnWASE = site !== "AAO" ? calculateULN(heightCm, 'WASE', site, gender, ageGroup) : "n/a";
            const ulnNORREDisplay = `${ulnNORRE} mm`; // ulnNORRE > 40 ? `${ulnNORRE} mm *` : `${ulnNORRE} cm`;
            //const ulnWASEDisplay = `${ulnWASE} cm`; //ulnWASE > 40 ? `${ulnWASE} mm *` : `${ulnWASE}`;
            const ulnWASEDisplay = site !=="AAO" ? `${ulnWASE} mm` : `${ulnWASE}`;
            return `<tr>
                        <td>${site}</td>
                        <td>${ulnNORREDisplay}</td>
                        <td>${ulnWASEDisplay}</td>
                    </tr>`;
        }).join('');
        return `
            <table class="striped">
                <thead data-theme="light">
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
    //hide the results explanation
    $('#resultsDescription').hide();
    $('#aortaForm').on('submit', function(event) {
        event.preventDefault();
        const gender = $('#gender').val();
        const ageGroup = $('#ageGroup').val();
        const heightCm = getHeightCm();
        if (heightCm) {
            const resultsTable = createResultsTable(heightCm, gender, ageGroup);
            $('#resultsContainer').html(resultsTable);
            $('#resultsDescription').show();
            $('#awaitingResults').hide();
            scrollToResults();
        } else {
            alert('Please enter a valid height.');
        }
    });

    function scrollToResults() {
        const resultsSection = document.getElementById('results');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
