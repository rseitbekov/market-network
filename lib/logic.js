/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {org.market.biznet.PlaceOrder} order
 * @transaction
 */
function PlaceOrderFunction(order) {
    
    var buyer = getCurrentParticipant();
    var good = order.good;
    var account = order.buyerAccount;

    if (good.state !== 'IN_STOCK') {
        throw new Error('The good "' + good.name + '" is not in stock!');
    }
    else if (buyer.getFullyQualifiedIdentifier() !== account.owner.getFullyQualifiedIdentifier()) {
        throw new Error('Account "' + account.IBAN + '" does not belong to buyer!');
    }
    else if (buyer.getFullyQualifiedIdentifier() === good.owner.getFullyQualifiedIdentifier()) {
        throw new Error('The good "' + good.name + '" already belongs to buyer!');
    }

    good.state = 'ON_HOLD';

    return getAssetRegistry('org.market.biznet.SalesAgreement')
        .then(function(agreementRegistry) {
            
            // Get the factory for creating new asset instances
            var factory = getFactory();

            var agreementId = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
      
            // Create the agreement
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
            return goodRegistry.update(good);
        });
}

/**
 * Sample transaction
 * @param {org.market.biznet.AcceptOrder} order
 * @transaction
 */
function AcceptOrderFunction(order) {
    
    var seller = getCurrentParticipant();
    
    var agreement = order.agreement;
    var account = order.sellerAccount;

    if (agreement.state !== 'WAITING_ACCEPT') {
        throw new Error('The agreement "' + agreement.salesId + '" is not waiting for acceptance!');
    }
    else if (seller.getFullyQualifiedIdentifier() !== agreement.seller.getFullyQualifiedIdentifier()) {
        throw new Error('You are not the seller of the good!');
    }
    else if (seller.getFullyQualifiedIdentifier() !== account.owner.getFullyQualifiedIdentifier()) {
        throw new Error('Account "' + account.IBAN + '" does not belong to seller!');
    }

    agreement.sellerAccount = account;
    agreement.state = 'WAITING_VALIDATE';

    return getAssetRegistry('org.market.biznet.SalesAgreement')
        .then(function (agreementRegistry) {            
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
function ValidateOrderFunction(order) {
    
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