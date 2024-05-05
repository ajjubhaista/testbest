"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePoolInfo = exports.getAmountInOut = exports.getActualRawAmount = exports.getCurrencyInOut = exports.getAssociatedTokenAddressSync = exports.getAccount = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const raydium_sdk_2 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const serum_1 = require("@project-serum/serum");
const bn_js_1 = require("bn.js");
function getAccount(connection_1, address_1, commitment_1) {
    return __awaiter(this, arguments, void 0, function* (connection, address, commitment, programId = raydium_sdk_1.TOKEN_PROGRAM_ID) {
        const info = yield connection.getAccountInfo(address, commitment);
        return (0, spl_token_1.unpackAccount)(address, info, programId);
    });
}
exports.getAccount = getAccount;
function getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve = false, programId = raydium_sdk_1.TOKEN_PROGRAM_ID, associatedTokenProgramId = raydium_sdk_1.ASSOCIATED_TOKEN_PROGRAM_ID) {
    if (!allowOwnerOffCurve && !web3_js_1.PublicKey.isOnCurve(owner.toBuffer()))
        throw new spl_token_1.TokenOwnerOffCurveError();
    const [address] = web3_js_1.PublicKey.findProgramAddressSync([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
    return address;
}
exports.getAssociatedTokenAddressSync = getAssociatedTokenAddressSync;
function getCurrencyInOut(poolKeys, direction) {
    let currencyInMint = poolKeys.quoteMint;
    let currencyOutMint = poolKeys.baseMint;
    let currencyInDecimals = poolKeys.quoteDecimals;
    let currencyOutDecimals = poolKeys.baseDecimals;
    if (direction === "out") {
        currencyInMint = poolKeys.baseMint;
        currencyOutMint = poolKeys.quoteMint;
        currencyInDecimals = poolKeys.baseDecimals;
        currencyOutDecimals = poolKeys.quoteDecimals;
    }
    let currencyIn = new raydium_sdk_1.Token(poolKeys.marketProgramId, currencyInMint, currencyInDecimals);
    let currencyOut = new raydium_sdk_1.Token(poolKeys.marketProgramId, currencyOutMint, currencyOutDecimals);
    return {
        currencyIn,
        currencyOut,
        currencyInDecimals,
        currencyOutDecimals,
        currencyInMint,
        currencyOutMint,
    };
}
exports.getCurrencyInOut = getCurrencyInOut;
/**rawAmount: in SOL
 * only for out direction
 */
function getActualRawAmount(connection, poolKeys, poolInfo, rawAmount // in SOL
) {
    const { currencyIn, currencyOut, currencyInDecimals } = getCurrencyInOut(poolKeys, "out");
    let amountIn = new raydium_sdk_1.TokenAmount(currencyIn, 1, false);
    const slippage = new raydium_sdk_1.Percent(10, 100); // 5% slippage
    const { amountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
        poolKeys,
        poolInfo,
        amountIn,
        currencyOut,
        slippage,
    });
    const actualRawAmount = (rawAmount * Math.pow(10, currencyInDecimals + 1)) /
        amountOut.numerator.toNumber();
    return actualRawAmount;
}
exports.getActualRawAmount = getActualRawAmount;
function getAmountInOut(connection, poolKeys, rawAmount, direction) {
    return __awaiter(this, void 0, void 0, function* () {
        const poolInfo = yield raydium_sdk_1.Liquidity.fetchInfo({ connection, poolKeys });
        let actualRawAmount = rawAmount;
        if (direction === "out") {
            actualRawAmount = getActualRawAmount(connection, poolKeys, poolInfo, rawAmount);
        }
        const { currencyIn, currencyOut } = getCurrencyInOut(poolKeys, direction);
        let amountIn = new raydium_sdk_1.TokenAmount(currencyIn, actualRawAmount, false);
        const slippage = new raydium_sdk_1.Percent(10, 100); // 5% slippage
        const { amountOut } = raydium_sdk_1.Liquidity.computeAmountOut({
            poolKeys,
            poolInfo,
            amountIn,
            currencyOut,
            slippage,
        });
        return { amountIn, amountOut };
    });
}
exports.getAmountInOut = getAmountInOut;
function getTokenAccounts(connection, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenResp = yield connection.getTokenAccountsByOwner(owner, {
            programId: raydium_sdk_1.TOKEN_PROGRAM_ID,
        });
        const accounts = [];
        for (const { pubkey, account } of tokenResp.value) {
            accounts.push({
                pubkey,
                accountInfo: raydium_sdk_2.SPL_ACCOUNT_LAYOUT.decode(account.data),
                programId: raydium_sdk_1.TOKEN_PROGRAM_ID
            });
        }
        return accounts;
    });
}
function parsePoolInfo(connection, owner, poolId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const tokenAccounts = yield getTokenAccounts(connection, owner);
        const programId = new web3_js_1.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
        // example to get pool info
        const info = yield connection.getAccountInfo(poolId);
        if (!info)
            return;
        const poolState = raydium_sdk_2.LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
        const OPENBOOK_PROGRAM_ID = new web3_js_1.PublicKey(poolState.marketProgramId);
        const openOrders = yield serum_1.OpenOrders.load(connection, poolState.openOrders, OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
        );
        const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
        const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();
        const baseTokenAmount = yield connection.getTokenAccountBalance(poolState.baseVault);
        const quoteTokenAmount = yield connection.getTokenAccountBalance(poolState.quoteVault);
        const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
        const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;
        const openOrdersBaseTokenTotal = openOrders.baseTokenTotal.toNumber() / baseDecimal;
        const openOrdersQuoteTokenTotal = openOrders.quoteTokenTotal.toNumber() / quoteDecimal;
        const base = (((_a = baseTokenAmount.value) === null || _a === void 0 ? void 0 : _a.uiAmount) || 0) + openOrdersBaseTokenTotal - basePnl;
        const quote = (((_b = quoteTokenAmount.value) === null || _b === void 0 ? void 0 : _b.uiAmount) || 0) +
            openOrdersQuoteTokenTotal -
            quotePnl;
        const denominator = new bn_js_1.BN(10).pow(poolState.baseDecimal);
        const addedLpAccount = tokenAccounts.find((a) => a.accountInfo.mint.equals(poolState.lpMint));
        const baseVault = baseTokenAmount.value.uiAmount;
        const quoteVault = quoteTokenAmount.value.uiAmount;
        const { publicKey: authority } = raydium_sdk_1.Liquidity.getAssociatedAuthority({ programId });
        const { publicKey: marketAuthority } = raydium_sdk_1.Market.getAssociatedAuthority({ programId, marketId: poolState.marketId });
        const allMarketIds = [poolState.marketId];
        const marketsInfo = {};
        try {
            const _marketsInfo = yield (0, raydium_sdk_1.getMultipleAccountsInfo)(connection, allMarketIds);
            for (const item of _marketsInfo) {
                if (item === null)
                    continue;
                const _i = Object.assign({ programId: item.owner }, raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(item.data));
                marketsInfo[_i.ownAddress.toString()] = _i;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                return console.error('failed to fetch markets', {
                    message: error.message,
                });
            }
        }
        return {
            base,
            quote,
            baseVault,
            quoteVault,
            baseInOpenOrders: openOrdersBaseTokenTotal,
            quoteInOpenOrders: openOrdersQuoteTokenTotal,
            totalLp: poolState.lpReserve.div(denominator).toString(),
            addedLpAmount: ((addedLpAccount === null || addedLpAccount === void 0 ? void 0 : addedLpAccount.accountInfo.amount.toNumber()) || 0) / baseDecimal,
            baseTokenDecimals: poolState.baseDecimal.toNumber(),
            quoteTokenDecimals: poolState.quoteDecimal.toNumber(),
            poolKeys: {
                id: poolId,
                baseVault: poolState.baseVault,
                quoteVault: poolState.quoteVault,
                baseMint: poolState.baseMint,
                quoteMint: poolState.quoteMint,
                lpMint: poolState.lpMint,
                openOrders: poolState.openOrders,
                marketId: poolState.marketId,
                marketProgramId: poolState.marketProgramId,
                targetOrders: poolState.targetOrders,
                withdrawQueue: poolState.withdrawQueue,
                lpVault: poolState.lpVault,
                owner: poolState.owner,
                baseDecimals: poolState.baseDecimal.toNumber(),
                quoteDecimals: poolState.baseDecimal.toNumber(),
                lpDecimals: poolState.baseDecimal.toNumber(),
                version: 4,
                programId,
                authority,
                marketVersion: 4,
                marketAuthority,
                marketBaseVault: marketsInfo[poolState.marketId.toBase58()].baseVault,
                marketQuoteVault: marketsInfo[poolState.marketId.toBase58()].quoteVault,
                marketBids: marketsInfo[poolState.marketId.toBase58()].bids,
                marketAsks: marketsInfo[poolState.marketId.toBase58()].asks,
                marketEventQueue: marketsInfo[poolState.marketId.toBase58()].eventQueue,
                lookupTableAccount: web3_js_1.PublicKey.default
            }
        };
    });
}
exports.parsePoolInfo = parsePoolInfo;
