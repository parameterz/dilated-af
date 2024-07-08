$(document).ready(function () {
  // Function to get height in cm
  function getHeightCm() {
    const heightCm = parseFloat($("#heightCm2").val());
    return !isNaN(heightCm) ? heightCm : null;
  }

  // Function to get gender
  function getGender() {
    return $("#gender").val();
  }

  // Function to get timing
  function getTiming() {
    return $("#timing").val();
  }

  // Function to get convention
  function getConvention() {
    return $("#convention").val();
  }

  // Function to update index, ULN, and equivalent measurement for a measurement
  function updateIndex(measurement, heightCm, gender, timing, convention) {
    const value = parseFloat($(`#${measurement}`).val());
    if (!isNaN(value) && heightCm && gender && timing && convention) {
      const { mean, sd } = data[timing][convention][measurement][gender];
      const uln = (mean + 2 * sd).toFixed(1);
      const equivalentMeasurement = (uln * (heightCm / 100)).toFixed(1);

      const index = (value / (heightCm / 100)).toFixed(1);
      const indexSpan = `<span class="${
        parseFloat(index) > uln ? "exceeds-uln" : ""
      }">${index}</span>`;
      const meanSpan = `<span>${mean}</span>`;
      const ulnSpan = `<span>${uln}</span>`;
      const eqMeasurementSpan = `<span>${equivalentMeasurement}</span>`;

      $(`#${measurement}-index`).html(`
                ${measurement} Index: ${indexSpan} <br>
                Mean: ${meanSpan} <br>
                ULN: ${ulnSpan} <br>
                Equivalent ${measurement} at ULN: ${eqMeasurementSpan} mm
            `);
    } else {
      $(`#${measurement}-index`).html("");
    }
  }

  // Function to update all indices
  function updateAllIndices() {
    const heightCm = getHeightCm();
    const gender = getGender();
    const timing = getTiming();
    const convention = getConvention();
    const measurements = ["SOV", "STJ", "AAO"];

    // Add the conditional measurements if the timing is diastole and convention is inside
    //console.log(timing, convention);
    if (timing === "diastole" && convention === "inside") {
      measurements.push("RCOR", "LCOR", "NONCOR");
      $(".optional-measurements").show();
    } else {
      $(".optional-measurements").hide();
    }

    measurements.forEach((measurement) =>
      updateIndex(measurement, heightCm, gender, timing, convention)
    );
  }

  // Function to update the displayed image based on timing and convention
  function updateImage() {
    const timing = getTiming();
    const convention = getConvention();
    $("#images img").addClass("hidden"); // Hide all images

    if (timing === "diastole" && convention === "inside") {
      $("#diastole_inside").removeClass("hidden");
      $("#sax_diastole_inside").removeClass("hidden");
    } else {
      $(`#${timing}_${convention}`).removeClass("hidden"); // Show the selected image
    }
  }

  // Attach event listeners to inputs and select elements
  $("#detailedAortaForm input, #detailedAortaForm select").on(
    "input change",
    function () {
      updateAllIndices();
      updateImage();
    }
  );

  // Set initial values if they exist in localStorage
  const initialHeightCm = localStorage.getItem("heightCm");
  const initialGender = localStorage.getItem("gender");
  const initialTiming = localStorage.getItem("timing");
  const initialConvention = localStorage.getItem("convention");
  if (initialHeightCm) {
    $("#heightCm2").val(initialHeightCm);
  }
  if (initialGender) {
    $("#gender").val(initialGender);
  }
  if (initialTiming) {
    $("#timing").val(initialTiming);
  }
  if (initialConvention) {
    $("#convention").val(initialConvention);
  }

  // Trigger initial calculation and image update if data is available
  updateAllIndices();
  updateImage();
});
