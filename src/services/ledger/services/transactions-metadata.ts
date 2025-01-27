import { NoTransactionToUpdateError, UnknownRepositoryError } from "@domain/errors"
import { CouldNotFindTransactionMetadataError } from "@domain/ledger"
import { fromObjectId, toObjectId } from "@services/mongoose/utils"

import { TransactionMetadata } from "../schema"

export const TransactionsMetadataRepository = (): ITransactionsMetadataRepository => {
  const updateByHash = async (
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | RepositoryError> => {
    const { hash, ...metadata } = ledgerTxMetadata
    try {
      const result = await TransactionMetadata.updateMany({ hash }, metadata)
      const success = result.nModified > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const persistAll = async (
    ledgerTxsMetadata: LedgerTransactionMetadata[],
  ): Promise<LedgerTransactionMetadata[] | RepositoryError> => {
    if (ledgerTxsMetadata.length === 0) return []

    try {
      const ledgerTxsMetadataPersist = ledgerTxsMetadata.map((txMetadata) => {
        const { id, ...metadata } = txMetadata
        return { _id: toObjectId<LedgerTransactionId>(id), ...metadata }
      })
      const result: TransactionMetadataRecord[] = await TransactionMetadata.insertMany(
        ledgerTxsMetadataPersist,
      )
      return result.map((txRecord) => translateToLedgerTxMetadata(txRecord))
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findById = async (id: LedgerTransactionId) => {
    try {
      const result = await TransactionMetadata.findOne({
        _id: toObjectId<LedgerTransactionId>(id),
      })
      if (!result) return new CouldNotFindTransactionMetadataError()
      return translateToLedgerTxMetadata(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    updateByHash,
    persistAll,
    findById,
  }
}

const translateToLedgerTxMetadata = (
  txMetadata: TransactionMetadataRecord,
): LedgerTransactionMetadata => ({
  id: fromObjectId<LedgerTransactionId>(txMetadata._id),
  hash: (txMetadata.hash as PaymentHash | OnChainTxHash) || undefined,
  revealedPreImage: (txMetadata.revealedPreImage as RevealedPreImage) || undefined,
})
