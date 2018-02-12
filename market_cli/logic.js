/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const
    BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection,
    AdminConnection = require('composer-admin').AdminConnection,
    Table = require('cli-table'),
    LOG = require('winston').loggers.get('application');


/** Class for the Market Network*/
class MarketNetwork {

   /**
    * Init connection
    */
    constructor() {
        this.bizNetworkConnection = new BusinessNetworkConnection();
    }

   /** 
    * @description Initalizes the MarketNetwork by making a connection to the Composer runtime usinf provided cert
    */
    async login(args) {
        try {
            var adminConnection = new AdminConnection();
            let userCertContent = args.options.content;

            await adminConnection.connect('admin@market-network');
            let cards = await adminConnection.getAllCards();

            let card, cert, cardname;
            let certFound = false;
            
            for (let curCardName of cards.keys()) {
                card = await adminConnection.exportCard(curCardName);
                cert = await card.getCredentials().certificate.toString();

                if (cert === userCertContent) {
                    cardname = curCardName;
                    certFound = true;
                    LOG.info('MarketNetwork:', 'Found matching identity!');
                    break;
                }
            }

            if (!certFound) {
                throw new Error('MarketNetwork:', 'Login failed.', 'No participant matching provided certificate!');
            }
            
            this.businessNetworkDefinition = await this.bizNetworkConnection.connect(cardname);

            LOG.info('MarketNetwork:', 'businessNetworkDefinition obtained', this.businessNetworkDefinition.getIdentifier());
            LOG.info('MarketNetwork:', 'You have successfully logged in as', cardname);
        } catch (err) {
            LOG.error('MarketNetwork:', err.message);
        } finally {
            await adminConnection.disconnect();
        }
    }

   /**
    * List traders
    * @return {Table} returns a table of traders.
    */
    async showTrader(options) {
        LOG.info("ShowTrader:", 'Getting the participant registry');

        try {
            if (options.all) {
                if (options.BIN) {
                    throw new Error('Option "all" cannot be used with any other options!');
                }
            }
            let participantRegistry = await this.bizNetworkConnection.getParticipantRegistry('org.market.biznet.Trader');

            let aResources = await participantRegistry.resolveAll();

            let table = new Table({
                head: ['BIN', 'Name']
            });

            for (let i = 0; i < aResources.length; i++) {

                if (options.BIN && options.BIN !== aResources[i].BIN) {
                    continue;
                }
                
                let tableLine = [];
                tableLine.push(aResources[i].BIN);
                tableLine.push(aResources[i].name);
                table.push(tableLine);
            }

            return table;
        } catch(error) {
            LOG.error('MarketNetwork: "ShowTrader" transaction failed', error.toString());
        }
    }

   /**
    * List accounts
    * @return {Table} returns a table of accounts.
    */
    async showAccount(options) {
        LOG.info("ShowAccount:", 'Getting the asset registry');

        try {
            if (options.all) {
                if (options.IBAN || options.owner) {
                    throw new Error('Option "all" cannot be used with any other options!');
                }
            } else {
                if (options.IBAN) {
                    if (options.owner) {
                        throw new Error('Option "IBAN" cannot be used with any other options!');
                    }                    
                }
            }
            let accountRegistry = await this.bizNetworkConnection.getAssetRegistry('org.market.biznet.Account');

            let aResources = await accountRegistry.resolveAll();

            let table = new Table({
                head: ['IBAN', 'OwnerBIN', 'OwnerName', 'Balance']
            });

            let owner;

            for (let i = 0; i < aResources.length; i++) {

                if (options.IBAN && options.IBAN !== aResources[i].IBAN ||
                        options.owner && options.owner !== aResources[i].owner.BIN) {
                    continue;
                }
                owner = aResources[i].owner;
                
                let tableLine = [];
                tableLine.push(aResources[i].IBAN);
                tableLine.push(owner.BIN || owner.split('#').pop());
                tableLine.push(owner.name || owner.split('#').pop());
                tableLine.push(aResources[i].balance);
                table.push(tableLine);
            }

            return table;
        } catch(error) {
            LOG.error('MarketNetwork: "ShowAccount" transaction failed', error.toString());
        }
    }

   /**
    * List agreements
    * @return {Table} returns a table of agreements.
    */
    async showAgreement(options) {
        LOG.info("ShowAgreement:", 'Getting the asset registry');

        try {
            if (options.all) {
                if (options.id || options.status) {
                    throw new Error('Option "all" cannot be used with any other options!');
                }
            } else {
                if (options.id) {
                    if (options.status) {
                        throw new Error('Option "id" cannot be used with any other options!');
                    }
                }
            }
            let agreementRegistry = await this.bizNetworkConnection.getAssetRegistry('org.market.biznet.SalesAgreement');

            let aResources = await agreementRegistry.resolveAll();

            let table = new Table({
                head: ['SalesID', 'BuyerBIN', 'BuyerName', 'BuyerAccount', 'SellerBIN', 'SellerName', 'SellerAccount',
                        'GoodName', 'State']
            });
            
            let buyer, seller, buyerAccount, sellerAccount, good;
            
            for (let i = 0; i < aResources.length; i++) {

                if (options.id && options.id !== aResources[i].salesId ||
                        options.status && options.status !== aResources[i].state) {
                    continue;
                }

                buyer = aResources[i].buyer;
                seller = aResources[i].seller;
                buyerAccount = aResources[i].buyerAccount;
                sellerAccount = aResources[i].sellerAccount;
                good = aResources[i].good;

                let tableLine = [];
                tableLine.push(aResources[i].salesId);
                tableLine.push(buyer.BIN || buyer.split('#').pop());
                tableLine.push(buyer.name || buyer.split('#').pop());
                tableLine.push(buyerAccount.IBAN || buyerAccount.split('#').pop());
                tableLine.push(seller.BIN || seller.split('#').pop());
                tableLine.push(seller.name || seller.split('#').pop());
                tableLine.push(sellerAccount ? (sellerAccount.IBAN || sellerAccount.split('#').pop()) : '');
                tableLine.push(good.goodId || good.split('#').pop());
                tableLine.push(aResources[i].state);
                table.push(tableLine);
            }

            return table;
        } catch(error) {
            LOG.error('MarketNetwork: "ShowAgreement" transaction failed', error.toString());
            throw error;
        }
    }

   /**
    * List goods
    * @return {Table} returns a table of goods.
    */
    async showGood(options) {
        LOG.info("ShowGood:", 'Getting the asset registry');

        try {
            if (options.all) {
                if (options.id || options.trader || options.status) {
                    throw new Error('Option "all" cannot be used with any other options!');
                }
            } else {
                if (options.id) {
                    if (options.trader || options.status) {
                        throw new Error('Option "id" cannot be used with any other options!');
                    }
                }
            }
            let goodRegistry = await this.bizNetworkConnection.getAssetRegistry('org.market.biznet.Good');

            let aResources = await goodRegistry.resolveAll();

            let table = new Table({
                head: ['GoodID', 'Name', 'Price', 'OwnerBIN', 'OwnerName', 'State']
            });

            let owner;
            
            for (let i = 0; i < aResources.length; i++) {

                if (options.id && options.id !== aResources[i].goodId ||
                        options.trader && options.trader !== aResources[i].owner.BIN ||
                        options.status && options.status !== aResources[i].state) {
                    continue;
                }

                owner = aResources[i].owner;

                let tableLine = [];
                tableLine.push(aResources[i].goodId);
                tableLine.push(aResources[i].name);
                tableLine.push(aResources[i].price);
                tableLine.push(owner.BIN || owner.split('#').pop());
                tableLine.push(owner.name || owner.split('#').pop());
                tableLine.push(aResources[i].state);
                table.push(tableLine);
            }

            return table;
        } catch(error) {
            LOG.error('MarketNetwork: "ShowGood" transaction failed', error.toString());
            throw error;
        }
    }

   /** 
    * Common method for transaction submitting
    */
    async transactionSubmit(jsonObj) {
                
        try {
            let serializer = await this.businessNetworkDefinition.getSerializer();
            let resource = await serializer.fromJSON(jsonObj);

            await this.bizNetworkConnection.submitTransaction(resource);
        } catch(error) {
            throw error;
        }
    }

   /** 
    * Add good to the registry
    */
    async addGood(options) {
        try {
            if (!options.name || !options.price) {
                throw new Error('Required options are missing, please refer to "--help" for usage');
            }

            let jsonObj = {
                '$class': 'org.market.biznet.AddGood',
                'name': options.name,
                'price': options.price
            }

            LOG.info("AddGood:", 'Submitting transaction');
            
            await this.transactionSubmit(jsonObj);

            return '"AddGood" transaction submitted successfully';
        } catch(error) {
            error.message = '"AddGood" transaction failed: ' + error.message;
            throw error;
        }
    }

   /** 
    * Remove good from the registry
    */
    async removeGood(options) {
        try {
            if (!options.good) {
                throw new Error('Required options are missing, please refer to "--help" for usage');
            }

            let jsonObj = {
                '$class': 'org.market.biznet.RemoveGood',
                'good': 'resource:org.market.biznet.Good#' + options.good
            }

            LOG.info("RemoveGood:", 'Submitting transaction');

            await this.transactionSubmit(jsonObj);

            return '"RemoveGood:": transaction submitted successfully';
        } catch(error) {
            error.message = '"RemoveGood" transaction failed: ' + error.message;
            throw error;
        }
    }

   /** 
    * Places order
    */
    async placeOrder(options) {
        try {
            if (!options.good || !options.account) {
                throw new Error('Required options are missing, please refer to "--help" for usage');
            }

            let jsonObj = {
                '$class': 'org.market.biznet.PlaceOrder',
                'good': 'resource:org.market.biznet.Good#' + options.good,
                'buyerAccount': 'resource:org.market.biznet.Account#' + options.account
            }

            LOG.info("PlaceOrder:", 'Submitting transaction');

            await this.transactionSubmit(jsonObj);

            return '"PlaceOrder": transaction submitted successfully';
        } catch(error) {
            error.message = '"PlaceOrder" transaction failed: ' + error.message;
            throw error;
        }
    }

   /** 
    * Accept placed order
    */
    async acceptOrder(options) {
        try {
            if (!options.agreement || !options.account) {
                throw new Error('Required options are missing, please refer to "--help" for usage');
            }

            let jsonObj = {
                '$class': 'org.market.biznet.AcceptOrder',
                'agreement': 'resource:org.market.biznet.SalesAgreement#' + options.agreement,
                'sellerAccount': 'resource:org.market.biznet.Account#' + options.account
            }

            LOG.info("AcceptOrder:", 'Submitting transaction');

            await this.transactionSubmit(jsonObj);

            return '"AcceptOrder": transaction submitted successfully';
        } catch(error) {
            error.message = '"AcceptOrder" transaction failed: ' + error.message;
            throw error;
        }
    }

   /** 
    * Validate accepted order
    */
    async validateOrder(options) {
        try {
            if (!options.agreement) {
                throw new Error('Required options are missing, please refer to "--help" for usage');
            }

            let jsonObj = {
              '$class': 'org.market.biznet.ValidateOrder',
              'agreement': 'resource:org.market.biznet.SalesAgreement#' + options.agreement
            }

            LOG.info("ValidateOrder:", 'Submitting transaction');

            await this.transactionSubmit(jsonObj);

            return '"ValidateOrder": transaction submitted successfully';
        } catch(error) {
            error.message = '"ValidateOrder" transaction failed: ' + error.message;
            throw error;
        }
    }

   /**
    * Entry point
    */
    async execCmd(fnName, args) {
        if (!this.businessNetworkDefinition) {
            LOG.error('You are not authenticated. Please login first.');
            return;
        }

        if (Object.keys(args.options).length == 0) {
            LOG.info('No arguments were provided. Please refer to "--help"');
            return;
        }
        //let fn = mn[fnName];
        try {
            let result = await this[fnName](args.options);
            LOG.info('MarketNetwork:\n' + result.toString());
        } catch (err) {
            LOG.error('MarketNetwork: ' + err.message);
        } finally {
            //await this.bizNetworkConnection.disconnect();
        }
    }
}

module.exports.MarketNetwork = MarketNetwork;