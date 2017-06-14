'use strict';

const annotateAd = require('../lib/annotateAd');

let adText = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', function(data) {
    adText += data;
});
process.stdin.on('end', function() {
    const facts = annotateAd({ body: adText });
    console.log(facts);
});
