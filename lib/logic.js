/**
 * Sample transaction
 * @param {org.market.biznet.AddGood} good
 * @transaction
 */
function addGood(good) {

    return getAssetRegistry('org.market.biznet.Good')
        .then(function(goodRegistry) {
            
            var factory = getFactory();
            var goodId = ('GOOD_' + Math.random().toString(36).substr(2, 5)).toUpperCase();
      
            var goodNew = factory.newResource('org.market.biznet', 'Good', goodId);
            goodNew.name = good.name;
            goodNew.price = good.price;
            goodNew.owner = getCurrentParticipant();
            goodNew.state = 'IN_STOCK';

            return goodRegistry.add(goodNew);
        /*})
        .catch(function (error) {
            // Add optional error handling here.*/
        });
}

/**
 * Sample transaction
 * @param {org.market.biznet.RemoveGood} good
 * @transaction
 */
function removeGood(good) {
    
    if (good.good.owner.getIdentifier() !== getCurrentParticipant().getIdentifier()) {
        throw new Error('Good "' + good.good.goodId + '" does not belong to trader!');
    } else if (good.good.state !== 'IN_STOCK') {
        throw new Error('You cannot remove ordered goods');
    }

    return getAssetRegistry('org.market.biznet.Good')
        .then(function (goodRegistry) {
            return goodRegistry.remove(good.good);
        /*})
        .catch(function (error) {
            // Add optional error handling here.*/
        });
}

/**
 * Sample transaction
 * @param {org.market.biznet.PlaceOrder} order
 * @transaction
 */
function placeOrder(order) {
    
    var buyer = getCurrentParticipant();
    var good = order.good;
    var account = order.buyerAccount;

    if (good.state !== 'IN_STOCK') {
        throw new Error('The good "' + good.name + '" is not in stock!');
    }
    else if (buyer.getIdentifier() !== account.owner.getIdentifier()) {
        throw new Error('Account "' + account.IBAN + '" does not belong to buyer!');
    }
    else if (buyer.getIdentifier() === good.owner.getIdentifier()) {
        throw new Error('The good "' + good.name + '" already belongs to buyer!');
    }    

    return getAssetRegistry('org.market.biznet.SalesAgreement')
        .then(function(agreementRegistry) {
            
            var factory = getFactory();

            var agreementId = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();

            var agreement = factory.newResource('org.market.biznet', 'SalesAgreement', agreementId);
            agreement.buyer = buyer;
            agreement.buyerAccount = account;
            agreement.seller = good.owner;
            agreement.good = good;
            agreement.state = 'WAITING_ACCEPT';

            return agreementRegistry.add(agreement);
        /*})
        .catch(function (error) {
            // Add optional error handling here.*/
        })
        .then(function() {
            return getAssetRegistry('org.market.biznet.Good')
        })
        .then(function(goodRegistry) {
            good.state = 'ON_HOLD';            
            return goodRegistry.update(good);
        });
}

/**
 * Sample transaction
 * @param {org.market.biznet.AcceptOrder} order
 * @transaction
 */
function acceptOrder(order) {
    
    var seller = getCurrentParticipant();    
    var agreement = order.agreement;
    var account = order.sellerAccount;

    if (agreement.state !== 'WAITING_ACCEPT') {
        throw new Error('The agreement "' + agreement.salesId + '" is not waiting for acceptance!');
    }
    else if (seller.getIdentifier() !== agreement.seller.getIdentifier()) {
        throw new Error('You are not the seller of the good "' + good.name + '"!');
    }
    else if (seller.getIdentifier() !== account.owner.getIdentifier()) {
        throw new Error('Account "' + account.IBAN + '" does not belong to seller!');
    }

    return getAssetRegistry('org.market.biznet.SalesAgreement')
        .then(function (agreementRegistry) {            
            agreement.sellerAccount = account;
            agreement.state = 'WAITING_VALIDATE';

            return agreementRegistry.update(agreement);
        /*})
        .catch(function (error) {
            // Add optional error handling here.*/
        });
}

/**
 * Sample transaction
 * @param {org.market.biznet.ValidateOrder} order
 * @transaction
 */
function validateOrder(order) {
    
    var agreement = order.agreement;

    var good = agreement.good;
    var buyer = agreement.buyer;
    var buyerAccount = agreement.buyerAccount;
    var sellerAccount = agreement.sellerAccount;

    if (agreement.state !== 'WAITING_VALIDATE') {
        throw new Error('The agreement "' + agreement.salesId + '" is not waiting for validation!');
    }

    if (buyerAccount.balance < good.price) {
        good.state = 'IN_STOCK';
        agreement.state = 'INVALID';
    }
    else {
        buyerAccount.balance -= good.price;
        sellerAccount.balance += good.price;
        good.owner = buyer;
        good.state = 'IN_PROPERTY';
        agreement.state = 'VALID';
    }

    return getAssetRegistry('org.market.biznet.Good')
        .then(function(goodRegistry) {
            return goodRegistry.update(good);
        })
        .then(function() {
            return getAssetRegistry('org.market.biznet.Account')
        })
        .then(function(traderRegistry) {
            return traderRegistry.updateAll([buyerAccount, sellerAccount]);
        })
        .then(function() {
            return getAssetRegistry('org.market.biznet.SalesAgreement')
        })
        .then(function(agreementRegistry) {
            return agreementRegistry.update(agreement);
        });
}
