import crypto from "crypto"

import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import { translateMemo, WalletTransactionHistory } from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"
import { IncomingOnChainTransaction } from "@domain/bitcoin/onchain"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config"
import { WalletCurrency } from "@domain/shared"
import { toCents } from "@domain/fiat"

describe("WalletTransactionHistory.fromLedger", () => {
  describe("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const fee = toSats(2)
    const feeUsd = 0.1

    const baseLedgerTransaction = {
      id: "id" as LedgerTransactionId,
      fee,
      feeUsd,
      pendingConfirmation: false,
      journalId: "journalId" as LedgerJournalId,
      timestamp,
      feeKnownInAdvance: false,
    }

    const baseWalletTransaction = {
      id: "id" as LedgerTransactionId,
      status: TxStatus.Success,
      createdAt: timestamp,
    }

    const ledgerTxnsInputs = ({
      walletId,
      settlementAmount,
      usd,
      currency,
    }: {
      walletId: WalletId
      settlementAmount: Satoshis | UsdCents
      usd: number
      currency: WalletCurrency
    }): LedgerTransaction<WalletCurrency>[] => {
      const currencyBaseLedgerTxns = { ...baseLedgerTransaction, walletId, usd, currency }

      return [
        {
          ...currencyBaseLedgerTxns,
          type: LedgerTransactionType.Invoice,

          debit: toSats(0),
          credit: settlementAmount,

          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
          memoFromPayer: "SomeMemo",
        },
        {
          ...currencyBaseLedgerTxns,
          recipientWalletId: "walletIdRecipient" as WalletId,
          type: LedgerTransactionType.IntraLedger,

          debit: toSats(0),
          credit: settlementAmount,

          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
          username: "username" as Username,
        },
        {
          ...currencyBaseLedgerTxns,
          recipientWalletId: "walletIdRecipient" as WalletId,
          type: LedgerTransactionType.OnchainIntraLedger,

          debit: toSats(0),
          credit: settlementAmount,

          address: "address" as OnChainAddress,
          txHash: "txHash" as OnChainTxHash,
        },
        {
          ...currencyBaseLedgerTxns,
          type: LedgerTransactionType.OnchainReceipt,

          debit: toSats(0),
          credit: settlementAmount,

          address: "address" as OnChainAddress,
          txHash: "txHash" as OnChainTxHash,
        },
      ]
    }

    const expectedWalletTxns = ({
      walletId,
      settlementAmount,
      usd,
      currency,
    }: {
      walletId: WalletId
      settlementAmount: Satoshis | UsdCents
      usd: number
      currency: WalletCurrency
    }): WalletTransaction[] => {
      const settlementFee =
        currency === WalletCurrency.Btc ? toSats(fee) : toCents(Math.floor(feeUsd * 100))
      const displayCurrencyPerSettlementCurrencyUnit = Math.abs(usd / settlementAmount)

      if (currency === WalletCurrency.Usd) {
        expect(displayCurrencyPerSettlementCurrencyUnit).toEqual(0.01)
      }

      const currencyBaseWalletTxns = {
        ...baseWalletTransaction,
        walletId,
        settlementCurrency: currency,

        settlementAmount,
        settlementFee,
        displayCurrencyPerSettlementCurrencyUnit,
      }

      return [
        {
          ...currencyBaseWalletTxns,
          initiationVia: {
            type: PaymentInitiationMethod.Lightning,
            paymentHash: "paymentHash" as PaymentHash,
            pubkey: "pubkey" as Pubkey,
          },
          settlementVia: {
            type: SettlementMethod.Lightning,
            revealedPreImage: null,
          },
          memo: "SomeMemo",
        },

        {
          ...currencyBaseWalletTxns,
          initiationVia: {
            type: PaymentInitiationMethod.Lightning,
            paymentHash: "paymentHash" as PaymentHash,
            pubkey: "pubkey" as Pubkey,
          },
          settlementVia: {
            type: SettlementMethod.IntraLedger,
            counterPartyWalletId: "walletIdRecipient" as WalletId,
            counterPartyUsername: "username" as Username,
          },
          memo: null,
        },
        {
          ...currencyBaseWalletTxns,
          initiationVia: {
            type: PaymentInitiationMethod.OnChain,
            address: "address" as OnChainAddress,
          },
          settlementVia: {
            type: SettlementMethod.IntraLedger,
            counterPartyWalletId: "walletIdRecipient" as WalletId,
            counterPartyUsername: null,
          },
          memo: null,
        },
        {
          ...currencyBaseWalletTxns,
          initiationVia: {
            type: PaymentInitiationMethod.OnChain,
            address: "address" as OnChainAddress,
          },
          settlementVia: {
            type: SettlementMethod.OnChain,
            transactionHash: "txHash" as OnChainTxHash,
          },
          memo: null,
        },
      ]
    }

    it("translates btc ledger txs", () => {
      const currency = WalletCurrency.Btc
      const settlementAmount = toSats(100000)
      const usd = 20

      const txnsArgs = {
        walletId: crypto.randomUUID() as WalletId,
        settlementAmount,
        usd,
        feeUsd,
        currency,
      }

      const ledgerTransactions = ledgerTxnsInputs(txnsArgs)
      const result = WalletTransactionHistory.fromLedger(ledgerTransactions)

      const expected = expectedWalletTxns(txnsArgs)
      expect(result.transactions).toEqual(expected)
    })

    it("translates usd ledger txs", () => {
      const currency = WalletCurrency.Usd
      const settlementAmount = toCents(2000)
      const usd = 20

      const txnsArgs = {
        walletId: crypto.randomUUID() as WalletId,
        settlementAmount,
        usd,
        feeUsd,
        currency,
      }

      const ledgerTransactions = ledgerTxnsInputs(txnsArgs)
      const result = WalletTransactionHistory.fromLedger(ledgerTransactions)

      const expected = expectedWalletTxns(txnsArgs)
      expect(result.transactions).toEqual(expected)
    })
  })
})

describe("translateDescription", () => {
  it("returns the memoFromPayer", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
    })
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer", () => {
    const result = translateMemo({
      lnMemo: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
    })
    expect(result).toEqual("some memo")
  })

  it("returns null under spam thresh", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 1,
    })
    expect(result).toBeNull()
  })

  it("returns memo for debit under spam threshold", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 0,
    })
    expect(result).toEqual("some memo")
  })
})

describe("ConfirmedTransactionHistory.addPendingIncoming", () => {
  it("translates submitted txs to wallet txs", () => {
    const walletId = crypto.randomUUID() as WalletId

    const timestamp = new Date(Date.now())
    const incomingTxs: IncomingOnChainTransaction[] = [
      IncomingOnChainTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash" as OnChainTxHash,
          outs: [
            {
              sats: toSats(25000),
              address: "userAddress1" as OnChainAddress,
            },
            {
              sats: toSats(50000),
              address: "userAddress2" as OnChainAddress,
            },
            {
              sats: toSats(25000),
              address: "address3" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      }),
    ]
    const history = WalletTransactionHistory.fromLedger([])
    const addresses = ["userAddress1", "userAddress2"] as OnChainAddress[]
    const result = history.addPendingIncoming({
      pendingIncoming: incomingTxs,
      addressesByWalletId: { [walletId]: addresses },
      walletDetailsByWalletId: { [walletId]: { currency: WalletCurrency.Btc } },
      displayCurrencyPerSat: 1 as DisplayCurrencyPerSat,
    })
    const expected = [
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress1" as OnChainAddress,
        },
        memo: null,
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        settlementCurrency: WalletCurrency.Btc,
        displayCurrencyPerSettlementCurrencyUnit: 1,
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress2" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
        settlementAmount: toSats(50000),
        settlementCurrency: WalletCurrency.Btc,
        memo: null,
        settlementFee: toSats(0),
        displayCurrencyPerSettlementCurrencyUnit: 1,

        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })

  it("translates handles price NaN", () => {
    const walletId = crypto.randomUUID() as WalletId

    const timestamp = new Date(Date.now())
    const incomingTxs: IncomingOnChainTransaction[] = [
      IncomingOnChainTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash" as OnChainTxHash,
          outs: [
            {
              sats: toSats(25000),
              address: "userAddress1" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      }),
    ]
    const history = WalletTransactionHistory.fromLedger([])
    const addresses = ["userAddress1"] as OnChainAddress[]
    const result = history.addPendingIncoming({
      pendingIncoming: incomingTxs,
      addressesByWalletId: { [walletId]: addresses },
      walletDetailsByWalletId: { [walletId]: { currency: WalletCurrency.Btc } },
      displayCurrencyPerSat: NaN as DisplayCurrencyPerSat,
    })
    const expected = [
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress1" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
        memo: null,
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        settlementCurrency: WalletCurrency.Btc,
        displayCurrencyPerSettlementCurrencyUnit: NaN,
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
