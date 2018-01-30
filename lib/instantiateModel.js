/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.market.biznet.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
function instantiateModel(setupDemo) {
    
    var factory = getFactory();
    var NS = 'org.market.biznet';

    // create the traders
    var trader1 = factory.newResource(NS, 'Trader', '890717300354');
    trader1.name = 'AO "MAGMNUM"';

    var trader2 = factory.newResource(NS, 'Trader', '551205301763');
    trader2.name = 'TOO "HOZYAYUSHKA"';

    // create the accounts
    var account1 = factory.newResource(NS, 'Account', 'KZ75125KZT2069100101');
    account1.owner = trader1;
    account1.balance = 4500;

    var account2 = factory.newResource(NS, 'Account', 'KZ75125KZT2069100102');
    account2.owner = trader2;
    account2.balance = 3300;

    // create the bank
    var bank = factory.newResource(NS, 'Bank', '830740000137');
    bank.name = 'BANK';
    bank.BIK = 'SAWRKZQA';

    // create the good1
    var good1 = factory.newResource(NS, 'Good', 'GOOD_1');
    good1.name = 'VEDRO';
    good1.price = 1017;
    good1.owner = trader1;
    good1.state = 'IN_STOCK';

    // create the good2
    var good2 = factory.newResource(NS, 'Good', 'GOOD_2');
    good2.name = 'SHVABRA';
    good2.price = 5467;
    good2.owner = trader1;
    good2.state = 'IN_STOCK';

    // create the good3
    var good3 = factory.newResource(NS, 'Good', 'GOOD_3');
    good3.name = 'VENIK';
    good3.price = 3002;
    good3.owner = trader1;
    good3.state = 'IN_STOCK';

    return getParticipantRegistry(NS + '.Trader')
        .then(function (traderRegistry) {
            // add the traders
            return traderRegistry.addAll([trader1, trader2]);
        })
        .then(function() {
            return getParticipantRegistry(NS + '.Bank');
        })
        .then(function(bankRegistry) {
            // add the bank
            return bankRegistry.addAll([bank]);
        })
        .then(function() {
            return getAssetRegistry(NS + '.Account');
        })
        .then(function(accountRegistry) {
            // add the accounts
            return accountRegistry.addAll([account1, account2]);
        })
        .then(function() {
            return getAssetRegistry(NS + '.Good');
        })
        .then(function(goodRegistry) {
            // add the goods
            return goodRegistry.addAll([good1, good2, good3]);
        });
}