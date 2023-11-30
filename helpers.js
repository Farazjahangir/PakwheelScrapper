exports.extractNumberFromText = (value) => {
  // Regular expression to match all numbers with commas
  const regex = /[0-9,]+/g;

  // Extract numbers from the text using the regular expression
  const numbersOnly = value.match(regex);

  // Remove commas from each extracted number and convert to a number type
  const result = numbersOnly.map(function (number) {
    return Number(number.replace(/,/g, ""));
  });

  return result[0];
};

// exports.formatPrice = (val) => {
//   // Regular expression to match the number part
//   const regex = /(\d+(\.\d+)?)\s*lacs?/i;

//   // Extract the matched number part from the text
//   const match = val.match(regex);
//   let result = 0;
//   // Check if a match is found
//   if (match) {
//     // Extracted number in string format
//     let numberString = match[1];

//     // Remove commas if any
//     numberString = numberString.replace(/,/g, "");

//     // Convert the string to a number
//     const number = parseFloat(numberString);

//     // Convert lacs to the actual number (multiply by 100,000)
//     result = number * 100000;
//   }

//   return result;
// };

exports.extractSpecificValueFromText = (value, list) => {
  // Regular expression to match any of the array elements
  const regex = new RegExp("\\b(" + list.join("|") + ")\\b", "i");

  // Extract the matched value from the text
  const match = value.match(regex);
  let matchedValue = "N/A";
  // Check if a match is found
  if (match) {
    matchedValue = match[0];
  }

  return matchedValue
};


exports.convertCurrencyToNumber = (val) => {
  // Remove non-numeric characters
  const numericValue = parseFloat(val.replace(/[^\d.]/g, ''));
  let result = 'N/A'
  
  if (val.includes('lacs')) {
      result = numericValue * 100000;
  } else if (val.includes('crore')) {
      result = numericValue * 10000000;
  }
  return result;
}