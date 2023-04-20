const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

async function computerVision(key, endpoint, imgUrl) {
    console.log(imgUrl)
    const computerVisionClient = new ComputerVisionClient(
        new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);
    return new Promise(async (resolve, reject) => {
        const captions = (await computerVisionClient.analyzeImage(imgUrl, { visualFeatures: ['Description'] })).description.captions[0].text;
        resolve(captions.split(' ').join('-'));
    });
}

module.exports = { computerVision };