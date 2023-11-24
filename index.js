const request = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");
const csv = require("fast-csv");

const {
  extractNumberFromText,
  formatPrice,
  extractSpecificValueFromText,
} = require("./helpers");

const { cities, carModelList, fileName } = require("./constant");

let defaultUrl =
  "https://www.pakwheels.com/used-cars/search/-/mk_suzuki/yr_2013_2021/ct_lahore/ct_karachi/ct_islamabad/ct_rawalpindi/md_wagon-r/";

const data = [];

const findNextPage = ($) => {
  var nextLi = $(
    "ul[class='pagination search-pagi'] li[class='page active']"
  ).next();

  return $(nextLi).find("a").text();
};

const createJSONPayload = ($2, index) => {
  const name = $2("h1").text();
  const model = extractSpecificValueFromText($2("h1").text(), carModelList);
  const price = $2('div[class="price-box"] > strong').text();
  const priceInNumber = formatPrice(
    $2('div[class="price-box"] > strong').text()
  );
  const city = extractSpecificValueFromText(
    $2('p[class="detail-sub-heading"] a').text(),
    cities
  );
  const cityFull = $2('p[class="detail-sub-heading"] a').text();
  const year = $2(
    "table[class*='table'] > tbody > tr td:nth-child(1) p a"
  ).text();
  const mileage = extractNumberFromText(
    $2("table[class*='table'] > tbody > tr td:nth-child(2) p").text()
  );
  const fuelType = $2(
    "table[class*='table'] > tbody > tr td:nth-child(3) p a"
  ).text();
  const transmission = $2(
    "table[class*='table'] > tbody > tr td:nth-child(4) p"
  ).text();
  const color = $2("ul[id='scroll_car_detail'] li:nth-child(4)").text();
  const assembly = $2("ul[id='scroll_car_detail'] li:nth-child(6)").text();
  const engineCapacity = extractNumberFromText(
    $2("ul[id='scroll_car_detail'] li:nth-child(8)").text()
  );
  const bodyType = $2("ul[id='scroll_car_detail'] li:nth-child(10) a").text();

  return {
    Name: name,
    Model: model,
    Price: price,
    ["Price In Numbers"]: priceInNumber,
    City: city,
    ["Full City"]: cityFull,
    Year: year,
    Mileage: mileage,
    ["Fuel Type"]: fuelType,
    Transmission: transmission,
    Color: color,
    Assembly: assembly,
    ["Engine Capacity"]: engineCapacity,
    ["Body Type"]: bodyType,
  };
};

const createCSVFile = (data) => {
  const ws = fs.createWriteStream(fileName);
  csv
    .write(data, { headers: true })
    .pipe(ws)
    .on("finish", function () {
      console.log("CSV file created and data exported successfully");
    })
    .on("error", function (err) {
      console.error("Error creating CSV file:", err);
    });
};

const mergeWithExistingData = (newData) => {
  const existingData = [];

  // Read existing data from CSV file
  fs.createReadStream(fileName)
    .pipe(csv.parse({ headers: true }))
    .on("data", (row) => {
      existingData.push(row);
    })
    .on("end", () => {
      // Merge existing data with new data
      const mergedData = existingData.concat(newData);

      // Write merged data back to CSV file
      const ws = fs.createWriteStream(fileName);
      csv
        .write(mergedData, { headers: true })
        .pipe(ws)
        .on("finish", function () {
          console.log("Data merged and exported to CSV file successfully");
        })
        .on("error", function (err) {
          console.error("Error merging data and exporting to CSV file:", err);
        });
    });
};

const exportDataInCSV = (data) => {
  fs.access(fileName, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, create a new one
      createCSVFile(data);
    } else {
      // If file exists, read existing data and merge with new data
      mergeWithExistingData(data);
    }
  });
};

const extractListData = async (url) => {
  try {
    console.log("URL => ", url);
    const response = await request(url);
    const $ = cheerio.load(response);
    const divWithUl = $("div[class*='search-listing'] div:nth-child(2)");
    const promises = [];
    divWithUl.find("ul").each(function (_, ulElem) {
      $(ulElem)
        .find('li[class*="classified-listing"]')
        .each(async function (i, liElem) {
          const scriptTagText = $(liElem).find("script").text()
          if (scriptTagText) {
            const detailsObj = JSON.parse(scriptTagText);
            const detailsUrl = detailsObj.offers.url;
  
            const promise = request(detailsUrl)
              .then((res) => {
                const $2 = cheerio.load(res);
                const payload = createJSONPayload($2, i);
                data.push(payload);
              })
              .catch((err) => {
                console.log(
                  `Req Failed ${detailsUrl} ${
                    err?.message || "Something went wrong"
                  }`
                );
              });
  
            promises.push(promise);
          }
        });
    });
    await Promise.all(promises);
    const nextPage = findNextPage($);
    if (nextPage) {
      extractListData(`${defaultUrl}?page=${nextPage}`);
    } else {
      exportDataInCSV(data);
    }
  } catch (e) {
    console.log("ERR ==>", e?.message || "Something Went Wrong");
  }
};

(async () => {
  console.log("Fetching Data");
  extractListData(defaultUrl);
  // const divWithUl = $("div[class*='search-listing'] div:nth-child(2)");
  // const promises = [];
  // divWithUl.find("ul").each(function (i, e) {
  //   $(this)
  //     .find('li[class*="classified-listing"]')
  //     .each(async function (i, e) {
  //       const detailsObj = JSON.parse($(e).find("script").text());
  //       const detailsUrl = detailsObj.offers.url;

  //       const promise = request(detailsUrl).then((res) => {
  //         const $2 = cheerio.load(res);
  //         data.push({
  //           name: $2("h1").text(),
  //           price: $2('div[class="price-box"] > strong').text(),
  //         });
  //       }) .catch(err => {
  //         console.log(`Req Failed ${detailsUrl} ${err?.message || "Something went wrong"}`)
  //       })

  //       promises.push(promise)
  //     });
  // });
  // await Promise.all(promises)
  // console.log("DATA ****", data)
  //   await Promise.all(promises);
})();

//   const detailRes = await request(detailsUrl);
//   const $2 = cheerio.load(detailRes);
//   data.push({
//     name: $2("h1").text(),
//     price: $2('div[class="price-box"] > strong').text(),
//   });
//   console.log("text()", $2("h1").text());
//   console.log("prive", $2('div[class="price-box"] > strong').text());
//   console.log("DATA", data);
// const promise = request(detailsUrl)
//   .then((res) => {
//     const $2 = cheerio.load(res);
//     data.push({
//       price: $2('div[class="price-box"] > strong').text(),
//       name: $("h1").text()
//     });
//   })
//   .catch((error) => {
//     console.error("Error in request:", error);
//   });

// Add the promise to the array
// promises.push(promise);
