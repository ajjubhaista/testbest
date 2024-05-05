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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapBot = void 0;
// SwapBot.js
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const dotenv_1 = require("dotenv");
const swap_1 = require("../swap"); // Adjust the path as necessary
(0, dotenv_1.config)();
const payer = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(String(process.env.WALLET_SECRET_KEY)));
if (!payer)
    throw new Error("WALLET_SECRET_KEY error please check before using.");
class SwapBot {
    constructor(poolInfo) {
        this.totalOrdersPlaced = 0;
        this.connection = new web3_js_1.Connection('https://prettiest-weathered-wave.solana-mainnet.quiknode.pro/0f106f9c0f64273f73d79c67d19eb118062c9465/');
        this.payer = payer;
        this.poolInfo = poolInfo;
        this.BUY_ORDER_AMOUNT = process.env.BUY_ORDER_AMOUNT;
        this.BUY_ORDER_NO = process.env.BUY_ORDER_NO;
        this.SELL_ORDER_AMOUNT = process.env.SELL_ORDER_AMOUNT;
        this.SELL_ORDER_NO = process.env.SELL_ORDER_NO;
        this.ORDER_INTERVAL = process.env.ORDER_INTERVAL;
        this.TARGET_SOL_AMOUNT = process.env.TARGET_SOL_AMOUNT;
        this.MINT_AMOUNT = process.env.MINT_AMOUNT;
        this.POOL_ID = process.env.POOL_ID;
    }
    sleep(time) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("sleeping:", time, "ms");
            return new Promise((resolve) => {
                setTimeout(resolve, time); // ms
            });
        });
    }
    interleaveArrays(arr1, arr2) {
        const result = [];
        for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
            if (i < arr1.length) {
                result.push(arr1[i]);
            }
            if (i < arr2.length) {
                result.push(arr2[i]);
            }
        }
        return result;
    }
    getShuffledOrders() {
        const buys = Array.from(Array(Number(this.BUY_ORDER_NO))).map((_) => "buy");
        const sells = Array.from(Array(Number(this.SELL_ORDER_NO))).map((_) => "sell");
        const shuffle = this.interleaveArrays(buys, sells);
        return shuffle;
    }
    createBuyorder() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Creating buy order for", this.totalOrdersPlaced);
            if (!this.poolKeys) {
                return;
            }
            const resp = yield (0, swap_1.SwapRaydiumLp)(this.connection, this.payer, Number(this.BUY_ORDER_AMOUNT), // in SOL
            "in", this.poolKeys);
            console.log("buy order created:", resp);
            return resp;
        });
    }
    createSellOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Creating sell order for", this.totalOrdersPlaced);
            if (!this.poolKeys) {
                return;
            }
            const resp = yield (0, swap_1.SwapRaydiumLp)(this.connection, this.payer, Number(this.SELL_ORDER_AMOUNT), // in SOL
            "out", this.poolKeys);
            console.log("sell order created:", resp);
            return resp;
        });
    }
    startProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.MINT_AMOUNT) {
                throw new Error("MINT_AMOUNT error please check before using.");
            }
            if (!this.POOL_ID) {
                throw new Error("POOL_ID error please check before using.");
            }
            if (!this.TARGET_SOL_AMOUNT) {
                throw new Error("TARGET_SOL_AMOUNT error please check before using.");
            }
            // while (true) {
            try {
                const poolInfo = this.poolInfo;
                if (poolInfo && (poolInfo === null || poolInfo === void 0 ? void 0 : poolInfo.quote) > Number(this.TARGET_SOL_AMOUNT)) {
                    this.poolKeys = poolInfo.poolKeys;
                    // const mintPubkey = poolInfo.poolKeys.baseMint;
                    // const mintPubkey = new PublicKey('3rv3LytY1WNiJnf4rQeGwjSGcd9dZ83HeKqo5Fqp6Vo4');
                    // const destPubkey = await getAssociatedTokenAddress(mintPubkey, payer.publicKey);
                    // await mintTo(
                    //   this.connection, 
                    //   this.payer, 
                    //   mintPubkey, 
                    //   destPubkey, 
                    //   this.payer, 
                    //   Number(this.MINT_AMOUNT) * Math.pow(10, poolInfo.baseTokenDecimals)
                    // );
                    const orders = this.getShuffledOrders();
                    for (const direction of orders) {
                        this.totalOrdersPlaced += 1;
                        if (direction === "buy") {
                            yield this.createBuyorder();
                        }
                        else if (direction === "sell") {
                            yield this.createSellOrder();
                        }
                        yield this.sleep(Number(this.ORDER_INTERVAL));
                    }
                }
                else {
                    yield this.sleep(Number(this.ORDER_INTERVAL));
                }
                return true;
            }
            catch (e) {
                console.log("Error occurred:", e);
                console.log("=========================================================================");
                console.log("=                  -->>>>>>CHECK WALLET BALANCES<<<<<---                =");
                console.log("=========================================================================");
                // Optional: Add some delay before restarting to avoid rapid failure loops
                yield this.sleep(1000);
                return false;
            }
            // }
        });
    }
}
exports.SwapBot = SwapBot;
exports.default = SwapBot;
