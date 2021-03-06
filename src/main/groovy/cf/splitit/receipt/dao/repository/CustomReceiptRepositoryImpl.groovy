package cf.splitit.receipt.dao.repository

import cf.splitit.Util
import cf.splitit.receipt.dao.OrderedItemEntity
import cf.splitit.receipt.dao.ReceiptEntity
import cf.splitit.receipt.model.ItemStatus
import cf.splitit.user.dao.PersonEntity
import cf.splitit.user.dao.PersonRepository
import groovy.util.logging.Slf4j
import org.bson.types.ObjectId
import org.springframework.data.mongodb.core.ReactiveMongoOperations
import org.springframework.data.mongodb.core.query.Query
import org.springframework.data.mongodb.core.query.Update
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

import static org.springframework.data.mongodb.core.query.Criteria.where
import static org.springframework.data.mongodb.core.query.Query.query

@Component
@Slf4j
class CustomReceiptRepositoryImpl implements CustomReceiptRepository {

    final ReactiveMongoOperations mongoOperations
    final PersonRepository personRepository

    CustomReceiptRepositoryImpl(ReactiveMongoOperations mongoOperations, PersonRepository personRepository) {
        this.mongoOperations = mongoOperations
        this.personRepository = personRepository
    }

    @Override
    Mono<Void> addOrderedItem(String receiptId, OrderedItemEntity orderedItem) {
        Update updateOperation = new Update().push("orderedItems", orderedItem)
        return mongoOperations.updateFirst(query(where("_id").is(receiptId)), updateOperation, ReceiptEntity)
                              .flatMap(Util.&expectSingleUpdateResult)
    }

    @Override
    Mono<Boolean> incrementOrderedItemAmount(String receiptId, String orderedItemId, boolean isIncrement = true) {
        Update update = new Update().inc('orderedItems.$.count', isIncrement ? 1 : -1)

        def receiptFindCriteria = where("_id").is(receiptId)

        Query q
        if (!isIncrement) {
            q = query(receiptFindCriteria.and("orderedItems").elemMatch(where("_id").is(new ObjectId(orderedItemId)).and("count").gt(1)))
        } else {
            q = query(receiptFindCriteria.and("orderedItems._id").is(new ObjectId(orderedItemId)))
        }
        return mongoOperations.updateFirst(q, update, ReceiptEntity)
                              .flatMap({ result ->
            if (result.modifiedCount == 0 && !isIncrement) {
                return changeOrderedItemStatus(receiptId, orderedItemId, ItemStatus.DELETED).then(Mono.just(true))
            }
            return Util.expectSingleUpdateResult(result).then(Mono.just(false))
        })
    }

    @Override
    Mono<Void> changeOrderedItemStatus(String receiptId, String orderedItemId, ItemStatus status) {
        def q = query(where("_id").is(receiptId).and("orderedItems._id").is(new ObjectId(orderedItemId)))
        mongoOperations.updateFirst(q, new Update().set('orderedItems.$.status', status.toString()), ReceiptEntity)
                       .flatMap(Util.&expectSingleUpdateResult)
    }

    @Override
    Mono<Void> addUserToReceipt(String receiptId, String userId) {
        return personRepository.findById(userId)
                               .flatMap({ addUserToReceiptInteranl(receiptId, it) })
    }

    private Mono<Void> addUserToReceiptInteranl(String receiptId, PersonEntity person) {
        def update = new Update().push("members", person)
        return mongoOperations.updateFirst(query(where("_id").is(receiptId)), update, ReceiptEntity)
                              .flatMap(Util.&expectSingleUpdateResult)

    }
}
