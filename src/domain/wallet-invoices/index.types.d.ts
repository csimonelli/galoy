type BtcFromUsdFn = (
  amount: UsdPaymentAmount,
) => Promise<BtcPaymentAmount | DealerPriceServiceError>

type WalletInvoiceBuilderConfig = {
  dealerBtcFromUsd: BtcFromUsdFn
  lnRegisterInvoice: (
    args: RegisterInvoiceArgs,
  ) => Promise<RegisteredInvoice | LightningServiceError>
}

type WalletInvoiceBuilder = {
  withDescription: ({
    description,
    descriptionHash,
  }: {
    description: string
    descriptionHash?: string
  }) => WIBWithDescription
}

type WIBWithDescriptionState = WalletInvoiceBuilderConfig & {
  description: string
  descriptionHash?: string
}

type WIBWithDescription = {
  generatedForSelf: () => WIBWithOrigin
  generatedForRecipient: () => WIBWithOrigin
}

type WIBWithOriginState = WIBWithDescriptionState & {
  selfGenerated: boolean
}

type WIBWithOrigin = {
  withRecipientWallet: (
    recipientWallet: WalletDescriptor<WalletCurrency>,
  ) => WIBWithRecipient
}

type WIBWithRecipientState = WIBWithOriginState & {
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type WIBWithRecipient = {
  withAmount: (
    uncheckedAmount: number,
  ) => Promise<WIBWithAmount | ValidationError | DealerPriceServiceError>
  withoutAmount: () => WIBWithAmount
}

type WIBWithAmountState = WIBWithRecipientState & {
  hasAmount: boolean
  invoiceExpiration: InvoiceExpiration
  btcAmount: BtcPaymentAmount
  usdAmount?: UsdPaymentAmount
}

type LnAndWalletInvoice = {
  walletInvoice: WalletInvoice
  lnInvoice: LnInvoice
}

type WIBWithAmount = {
  registerInvoice: () => Promise<LnAndWalletInvoice | LightningServiceError>
}

type WalletInvoice = {
  paymentHash: PaymentHash
  selfGenerated: boolean
  pubkey: Pubkey
  usdAmount?: UsdPaymentAmount
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  paid: boolean
}

type WalletInvoiceReceiver = WalletInvoice & {
  usdToCreditReceiver: UsdPaymentAmount
  btcToCreditReceiver: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
  btcBankFee: BtcPaymentAmount
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type WalletInvoiceReceiverArgs = {
  walletInvoice: WalletInvoice
  receivedBtc: BtcPaymentAmount
  usdFromBtc(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  usdFromBtcMidPrice(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
}

type WalletInvoiceValidator = {
  validateToSend(fromWalletId: WalletId): true | ValidationError
}

interface IWalletInvoicesRepository {
  persistNew: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>

  markAsPaid: (paymentHash: PaymentHash) => Promise<WalletInvoice | RepositoryError>

  findByPaymentHash: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoice | RepositoryError>

  findPendingByWalletId: (
    walletId: WalletId,
  ) => AsyncGenerator<WalletInvoice> | RepositoryError

  listWalletIdsWithPendingInvoices: () => AsyncGenerator<WalletId> | RepositoryError

  deleteByPaymentHash: (paymentHash: PaymentHash) => Promise<boolean | RepositoryError>

  deleteUnpaidOlderThan: (before: Date) => Promise<number | RepositoryError>
}
