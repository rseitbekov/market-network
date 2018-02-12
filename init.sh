#!/bin/bash

# submit initial transaction populating participants and assets
composer transaction submit -c admin@market-network -d '{"$class": "org.market.biznet.SetupDemo"}'

# issue identity cards for corresponding participants
composer identity issue -c admin@market-network -f bank.card -u bank -a "resource:org.market.biznet.Bank#830740000137"
composer identity issue -c admin@market-network -f trader1.card -u trader1 -a "resource:org.market.biznet.Trader#890717300354"
composer identity issue -c admin@market-network -f trader2.card -u trader2 -a "resource:org.market.biznet.Trader#551205301763"

# import identity cards into network
composer card import -f bank.card -n bank@market-network
composer card import -f trader1.card -n trader1@market-network
composer card import -f trader2.card -n trader2@market-network

# initiate first use of identity to generate certificates
composer network ping -c bank@market-network
composer network ping -c trader1@market-network
composer network ping -c trader2@market-network
