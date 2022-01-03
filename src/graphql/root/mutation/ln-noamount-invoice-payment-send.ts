import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import { Wallets } from "@app"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"

const LnNoAmountInvoicePaymentInput = GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnIPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount, logger }) => {
    const { walletId, paymentRequest, amount, memo } = args.input
    for (const input of [walletId, memo, amount, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const status = await Wallets.payLnNoAmountInvoiceByWalletId({
      senderWalletId: walletId,
      paymentRequest,
      memo,
      amount,
      payerAccountId: domainAccount.id,
      logger,
    })

    if (status instanceof Error) {
      const appErr = mapError(status)
      return { status: "failed", errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default LnNoAmountInvoicePaymentSendMutation
