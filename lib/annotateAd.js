'use strict';

const city = Symbol('city');
const flatType = Symbol('flatType');
const roomCount = Symbol('roomCount');
const price = Symbol('price');
const startDate = Symbol('startDate');
const phoneNumber = Symbol('phoneNumber');

class Fact {
    constructor(domain, value) {
        this.domain = domain;
        this.value = value;
    }
}

const patterns = [
    { pattern: /warszaw/ig, fact: () => new Fact(city, 'Warszawa') },
    { pattern: /kawalerk/ig, fact: () => new Fact(flatType, 'studio') },
    { pattern: /mieszkani/ig, fact: () => new Fact(flatType, 'flat') },
    { pattern: /\bpok[oó]ju?\b/ig, fact: () => new Fact(flatType, 'room') },
    { pattern: /([0-9]+) *-? *pok/ig, fact: ([ , count ]) => new Fact(roomCount, Number(count)) },
    { pattern: /dw[au][ \-]?pokoj(?:e|owe)/ig, fact: () => new Fact(roomCount, 2) },
    { pattern: /trzy[ \-]?pokoj(?:e|owe)/ig, fact: () => new Fact(roomCount, 3) },
    { pattern: /czter[yo][ \-]?pokoj(?:e|owe)/ig, fact: () => new Fact(roomCount, 3) },
    { pattern: /([0-9]+)/g, fact: ([ amount ]) => ((amount >= 300 && amount <= 99999) ? new Fact(price, Number(amount)) : null) },
    { pattern: /\+?[0-9][0-9 \-]{5,14}[0-9]/g, fact: ([ number ]) => new Fact(phoneNumber, number) }
];

function postProcessFacts(facts) {
    function between(value, min, max) {
        return value >= min && value <= max;
    }
    // 1. Do collision checking and only leave the most "important" facts:
    // (This has quadratic complexity at the moment, pending optimization).
    const removedFacts = new Set();
    facts.forEach(function(fact1) {
        facts.forEach(function(fact2) {
            // Guard clause: do not resolve conflicts between a single fact and itself!
            if (fact1 === fact2) {
                return;
            }
            // Find out if the two facts' origins overlap:
            if (
                between(fact1.origin.start, fact2.origin.start, fact2.origin.end) ||
                between(fact1.origin.end, fact2.origin.start, fact2.origin.end)
            ) {
                // We have a conflicting pair. Elect one member to be removed.
                // As of now, we always treat the "longer" fact as the more meaningful.
                const fact1Length = fact1.origin.end - fact1.origin.start;
                const fact2Length = fact2.origin.end - fact2.origin.start;
                if (fact1Length > fact2Length) {
                    removedFacts.add(fact2);
                } else if (fact2Length > fact1Length) {
                    removedFacts.add(fact1);
                } else {
                    // Do not remove either of the facts - they are equally meaningful.
                }
                
            }
        });
    });
    // Filter out the removed facts:
    return facts.filter((fact) => !removedFacts.has(fact));
}

function annotateAd({ title, body, metadata }) {
    //TODO: Handle title as part of body or separately
    let facts = [];
    patterns.forEach(function findFacts({ pattern, fact: factGenerator }) {
        let match;
        while (match = pattern.exec(body)) {
            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            let fact = factGenerator(match);
            if (fact) {
                // Enrich the fact with the range it originally occupied in the input:
                fact.origin = { start: matchStart, end: matchEnd };
                facts.push(fact);
            }
        }
        // Reset the regular expression for use with other inputs:
        pattern.lastIndex = 0;
    });
    facts = postProcessFacts(facts);
    return facts;
}

module.exports = annotateAd;
