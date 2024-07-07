$(document).ready(function() {
    // Function to get height in cm
    function getHeightCm() {
        const heightCm = parseFloat($('#heightCm2').val());
        return !isNaN(heightCm) ? heightCm : null;
    }

    // Function to get gender
    function getGender() {
        return $('#gender').val();
    }

    // Function to update index, ULN, and equivalent measurement for a measurement
    function updateIndex(measurement, heightCm, gender) {
        const value = parseFloat($(`#${measurement}`).val());
        if (!isNaN(value) && heightCm && gender) {
            const index = (value / (heightCm / 100)).toFixed(1);
            const uln = data.NORRE[measurement][gender];
            const equivalentMeasurement = (uln * (heightCm / 100)).toFixed(1);

            const indexSpan = `<span class="${parseFloat(index) > uln ? 'exceeds-uln' : ''}">${index}</span>`;
            const ulnSpan = `<span>${uln}</span>`;
            const eqMeasurementSpan = `<span>${equivalentMeasurement}</span>`;

            $(`#${measurement}-index`).html(`
                ${measurement} Index: ${indexSpan} <br>
                ULN: ${ulnSpan} <br>
                Equivalent ${measurement} at ULN: ${eqMeasurementSpan} mm
            `);
        } else {
            $(`#${measurement}-index`).html('');
        }
    }

    // Function to update all indices
    function updateAllIndices() {
        const heightCm = getHeightCm();
        const gender = getGender();
        ['SOV', 'STJ', 'AAO'].forEach(measurement => updateIndex(measurement, heightCm, gender));
    }

    // Attach event listeners to inputs and select
    $('#detailedAortaForm input, #detailedAortaForm select').on('input change', updateAllIndices);

    // Set initial values if they exist in localStorage
    const initialHeightCm = localStorage.getItem('heightCm');
    const initialGender = localStorage.getItem('gender');
    if (initialHeightCm) {
        $('#heightCm2').val(initialHeightCm);
    }
    if (initialGender) {
        $('#gender').val(initialGender);
    }

    // Trigger initial calculation if data is available
    updateAllIndices();
});
