$(document).ready(function() {
    //console.log('Initial readonly state:', $('#heightCm2').prop('readonly')); // Should be false
    
    function getHeightCm() {
        const heightCm = parseFloat($('#heightCm2').val());
        return !isNaN(heightCm) ? heightCm : null;
    }

    function getGender() {
        return $('#gender').val();
    }

    function updateIndex(measurement, heightCm, gender) {
        const value = parseFloat($(`#${measurement}`).val());
        if (!isNaN(value)) {
            const index = (value / (heightCm / 100)).toFixed(1);
            const uln = data.NORRE[measurement][gender];
            const indexSpan = `<span class="${parseFloat(index) > uln ? 'exceeds-uln' : ''}">${index}</span>`;
            $(`#${measurement}-index`).html(`${measurement} Index: ${indexSpan} (ULN: ${uln})<hr/>`);
        } else {
            $(`#${measurement}-index`).html('');
        }
    }
    function updateAllIndices() {
        const heightCm = getHeightCm();
        const gender = getGender();
        ['SOV', 'STJ', 'AAO'].forEach(measurement => updateIndex(measurement, heightCm, gender));
    }
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
        //console.log('Readonly state after setting initial values:', $('#heightCm2').prop('readonly'));

        // Trigger initial calculation if data is available
        updateAllIndices();


});
