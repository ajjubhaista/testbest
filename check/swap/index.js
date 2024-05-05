"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SwapRaydiumLp = void 0;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const SplToken = __importStar(require("@solana/spl-token"));
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("./utils");
function getAtaInstruction(connection, mint, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const associatedToken = (0, utils_1.getAssociatedTokenAddressSync)(mint, owner);
        let createAtaInstruction;
        try {
            yield (0, utils_1.getAccount)(connection, associatedToken);
        }
        catch (error) {
            if (error instanceof SplToken.TokenAccountNotFoundError ||
                error instanceof SplToken.TokenInvalidAccountOwnerError) {
                createAtaInstruction = SplToken.createAssociatedTokenAccountInstruction(owner, associatedToken, owner, mint);
            }
            else
                throw error;
        }
        return createAtaInstruction;
    });
}
function SwapRaydiumLp(connection, payer, amount, direction, poolKeys) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const transaction = new web3_js_1.Transaction();
            const blockhash = yield connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash.blockhash;
            transaction.lastValidBlockHeight = blockhash.lastValidBlockHeight;
            const { currencyInMint, currencyOutMint } = (0, utils_1.getCurrencyInOut)(poolKeys, direction);
            const amountInAtaInstruction = yield getAtaInstruction(connection, currencyInMint, payer.publicKey);
            if (amountInAtaInstruction)
                transaction.add(amountInAtaInstruction);
            const amountOutAtaInstruction = yield getAtaInstruction(connection, currencyOutMint, payer.publicKey);
            if (amountOutAtaInstruction)
                transaction.add(amountOutAtaInstruction);
            const { amountIn, amountOut } = yield (0, utils_1.getAmountInOut)(connection, poolKeys, amount, direction);
            console.log(amountIn.numerator.toNumber(), amountOut.numerator.toNumber());
            const amountInAta = SplToken.getAssociatedTokenAddressSync(currencyInMint, payer.publicKey);
            const amountOutAta = SplToken.getAssociatedTokenAddressSync(currencyOutMint, payer.publicKey);
            if (direction === "in") {
                const solTransferInstruction = web3_js_1.SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: amountInAta,
                    lamports: amountIn.numerator.toNumber(),
                });
                transaction.add(solTransferInstruction);
                const syncAccountinstruction = SplToken.createSyncNativeInstruction(amountInAta);
                transaction.add(syncAccountinstruction);
            }
            const LAYOUT = (0, raydium_sdk_1.struct)([
                (0, raydium_sdk_1.u8)("instruction"),
                (0, raydium_sdk_1.u64)("amountIn"),
                (0, raydium_sdk_1.u64)("minAmountOut"),
            ]);
            const data = Buffer.alloc(LAYOUT.span);
            LAYOUT.encode({
                instruction: 9,
                amountIn: (0, raydium_sdk_1.parseBigNumberish)(amountIn.numerator.toNumber()),
                minAmountOut: (0, raydium_sdk_1.parseBigNumberish)(amountOut.numerator.toNumber()),
            }, data);
            const keys = [
                {
                    pubkey: SplToken.TOKEN_PROGRAM_ID,
                    isWritable: false,
                    isSigner: false,
                },
                {
                    pubkey: poolKeys.id,
                    isWritable: true,
                    isSigner: false,
                },
                {
                    pubkey: poolKeys.authority,
                    isWritable: false,
                    isSigner: false,
                },
                {
                    pubkey: poolKeys.openOrders,
                    isWritable: true,
                    isSigner: false,
                },
            ];
            keys.push({
                pubkey: poolKeys.targetOrders,
                isWritable: true,
                isSigner: false,
            });
            keys.push({
                pubkey: poolKeys.baseVault,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.quoteVault,
                isWritable: true,
                isSigner: false,
            });
            keys.push({
                pubkey: poolKeys.marketProgramId,
                isWritable: false,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketId,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketBids,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketAsks,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketEventQueue,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketBaseVault,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketQuoteVault,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: poolKeys.marketAuthority,
                isWritable: false,
                isSigner: false,
            }, {
                pubkey: amountInAta,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: amountOutAta,
                isWritable: true,
                isSigner: false,
            }, {
                pubkey: payer.publicKey,
                isWritable: false,
                isSigner: true,
            });
            const instruction = new web3_js_1.TransactionInstruction({
                programId: poolKeys.programId,
                keys,
                data,
            });
            transaction.add(instruction);
            const closedAccountInstruction = SplToken.createCloseAccountInstruction(direction === "in" ? amountInAta : amountOutAta, payer.publicKey, payer.publicKey);
            transaction.add(closedAccountInstruction);
            if (transaction.instructions.length === 0) {
                console.log("no instruction");
                return;
            }
            console.log("Sending...");
            return (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer]);
        }
        catch (error) {
            console.log(error);
            const exactError = (_a = error.logs) === null || _a === void 0 ? void 0 : _a.filter((l) => l.includes("Error:") || l.includes("insufficient"))[0];
            console.error("error:", exactError || error.message);
        }
    });
}
exports.SwapRaydiumLp = SwapRaydiumLp;
