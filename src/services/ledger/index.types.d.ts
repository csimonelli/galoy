type TxnGroup = keyof typeof import("./volume").TxnGroups
type TxnTypes = typeof import("./volume").TxnGroups[TxnGroup]

type RecordSendArgs = {
  description: string
  senderWalletDescriptor: WalletDescriptor<WalletCurrency>
  amountToDebitSender: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: SendLedgerMetadata
  bankFee?: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
}

type RecordReceiveArgs = {
  description: string
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  amountToCreditReceiver: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: ReceiveLedgerMetadata
  txMetadata: LnLedgerTransactionMetadataUpdate
  bankFee?: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
}

type RecordIntraledgerArgs = {
  description: string
  senderWalletDescriptor: WalletDescriptor<WalletCurrency>
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  amount: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: IntraledgerLedgerMetadata
  additionalDebitMetadata: TxMetadata
}

type LedgerMetadata = {
  type: LedgerTransactionType
  pending: boolean
}

type NonIntraledgerLedgerMetadata = LedgerMetadata & {
  usd: DisplayCurrencyBaseAmount // to be renamed amountDisplayCurrency
  fee: Satoshis
  feeUsd: DisplayCurrencyBaseAmount // to be renamed feeDisplayCurrency
}

type LnReceiveLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: PaymentHash
}

type OnChainReceiveLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
}

type SendAmountsMetadata = {
  satsAmount: Satoshis
  centsAmount: UsdCents
  satsFee: Satoshis
  centsFee: UsdCents

  displayAmount: DisplayCurrencyBaseAmount
  displayFee: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}

type AddLnSendLedgerMetadata = NonIntraledgerLedgerMetadata &
  SendAmountsMetadata & {
    hash: PaymentHash
    pubkey: Pubkey
    feeKnownInAdvance: boolean
  }

type AddOnchainSendLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddColdStorageLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  currency: WalletCurrency
}

type AddColdStorageReceiveLedgerMetadata = AddColdStorageLedgerMetadata

type AddColdStorageSendLedgerMetadata = AddColdStorageLedgerMetadata

type IntraledgerBaseMetadata = LedgerMetadata & {
  usd: DisplayCurrencyBaseAmount // to be renamed amountDisplayCurrency
  memoPayer?: string
  username?: Username
}

type AddLnIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
}

type NewAddLnIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata &
  SendAmountsMetadata & {
    hash: PaymentHash
    pubkey: Pubkey
  }

type AddOnChainIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddWalletIdIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata

type NewAddWalletIdIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata &
  SendAmountsMetadata

type FeeReimbursementLedgerMetadata = SendAmountsMetadata & {
  hash: PaymentHash
  type: LedgerTransactionType
  pending: boolean
  usd: DisplayCurrencyBaseAmount
  related_journal: LedgerJournalId
}

type LnRoutingRevenueLedgerMetadata = LedgerMetadata & {
  feesCollectedOn: string
}

type LnChannelOpenOrClosingFee = LedgerMetadata & {
  txid: OnChainTxHash
}

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<WalletId>
  dealerBtcWalletResolver: () => Promise<WalletId>
  dealerUsdWalletResolver: () => Promise<WalletId>
  funderWalletResolver: () => Promise<WalletId>
}

type ReceiveLedgerMetadata =
  | FeeReimbursementLedgerMetadata
  | LnReceiveLedgerMetadata
  | OnChainReceiveLedgerMetadata

type IntraledgerLedgerMetadata =
  | AddOnChainIntraledgerSendLedgerMetadata
  | AddLnIntraledgerSendLedgerMetadata
  | AddWalletIdIntraledgerSendLedgerMetadata

type SendLedgerMetadata = AddOnchainSendLedgerMetadata | AddLnSendLedgerMetadata
