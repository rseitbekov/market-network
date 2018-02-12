#!/usr/bin/env node
'use strict';

(function () {
    const
        program = require('vorpal')(),
        fs = require('fs'),
        //fsAutocomplete = require('vorpal-autocomplete-fs'),
        MarketNetwork = require('./logic').MarketNetwork;

    var mn = new MarketNetwork();

    let validation = (args) => {
        try {
            if (Object.keys(args.options).length == 0) {
                program.execSync('help login');
                return false;
            }
            var filename = args.options.keyFile;

            if (!fs.existsSync(filename)) {
                program.log('File does not exist or provided path is invalid');
                return false;
            }
            args.options.content = fs.readFileSync(filename, 'UTF-8');
        } catch (error) {
            program.log('MarketNetwork: ' + error.message);
            return false;
        }
    };

    program
        .command('login')
        .option('-f --keyFile <keyFile>', 'path to public key file')
        //.autocomplete(fsAutocomplete())
        .validate(validation)
        .action((options) => mn.login(options));

    program
        .command('show-trader')
        .option('-a, --all', 'List all traders')
        .option('-B, --BIN <BIN>', 'Show trader by BIN')
        .action((options) => mn.execCmd('showTrader', options));
        
    program
        .command('show-account')
        .option('-a, --all', 'List all accounts')
        .option('-I, --IBAN <IBAN>', 'Show account by IBAN')
        .option('-o, --owner <owner>', 'List accounts by owner')
        .action((options) => mn.execCmd('showAccount', options));

    program
        .command('show-agreement')
        .option('-a, --all', 'List all agreements')
        .option('-i, --id <id>', 'Show agreement by ID')
        .option('-s, --status <status>', 'List agreements by status')
        .action((options) => mn.execCmd('showAgreement', options));

    program
        .command('show-good')
        .option('-a, --all', 'List all goods')
        .option('-i, --id <id>','Show good by ID')
        .option('-t, --trader <trader>', 'List goods by trader BIN')
        .option('-s, --status <status>', 'List goods by status')
        .action((options) => mn.execCmd('showGood', options))
        .alias('showgood');
        
    program    
        .command('add-good')
        .option('-n, --name <name>', 'Good\'s name')
        .option('-p, --price <price>', 'Good\'s price')
        .action((options) => mn.execCmd('addGood', options));

    program
        .command('remove-good')
        .option('-g, --good <good>', 'Good')
        .action((options) => mn.execCmd('removeGood', options));

    program
        .command('place-order')
        .option('-g, --good <good>', 'Good')
        .option('-a, --account <account>', 'Buyer account')
        .action((options) => mn.execCmd('placeOrder', options));

    program
        .command('accept-order')
        .option('-o, --agreement <agreement>', 'Agreement')
        .option('-a, --account <account>', 'Seller account')
        .action((options) => mn.execCmd('acceptOrder', options));

    program
        .command('validate-order')
        .option('-o, --agreement <agreement>', 'Agreement')
        .action((options) => mn.execCmd('validateOrder', options));

    program
        .delimiter('market$')
        .show();

}).call(this);