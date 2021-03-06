import Button from 'material-ui/Button';
import Divider from "material-ui/Divider";
import List from "material-ui/List";
import ListSubheader from 'material-ui/List/ListSubheader';
import Snackbar from 'material-ui/Snackbar';
import React from "react";
import {withRouter} from "react-router-dom";
import NavigationHistory from "../../service/navigation-history";
import {receiptService} from "../../service/receipt-service.js";
import storage from "../../storage/storage.js"
import CustomMenuItem from "../menu/custom-menu-item.jsx";
import ShareLink from '../share-link.jsx'
import WaitingData from "../waiting-data.jsx";
import NewItemModal from "./receipt-item-create-modal.jsx";
import {OwnReceiptItem, ReceiptItem} from "./receipt-item.jsx";
import "./receipt.css";

const NotFoundReceipt = withRouter(props => {
    return (
        <div>
            {"This receipt was not found on the server ;("}
            <Button secondary={true} label="Return" onClick={() => props.history.push("/")}/>
        </div>
    )
});

export default class Receipt extends React.Component {

    constructor(args) {
        super(args);
        this.state = {
            rec: null,
            addNewItemPopupOpened: false,
            notFoundError: false,
            showItemDeletedMessage: false,
            itemDeletedMessage: "",
            deletedItemId: "",
            itemsIdWithPendingChange: [],
            showShareLink: false
        };

        this.additionalAction =
            <CustomMenuItem label="Add new item" action={() => this.setState({addNewItemPopupOpened: true})}/>
    }

    closeAddNewItemPopup() {
        this.setState({addNewItemPopupOpened: false});
    }

    render() {
        if (this.state.notFoundError) {
            return (<NotFoundReceipt/>);
        }
        let receipt = this.state.rec;
        if (!receipt) {
            return (<WaitingData/>);
        }
        let mySpending = receipt.totalsPerMember[storage.getState().user.id] || 0;
        let {myItems, otherItems} = this.renderItems();
        return (
            <section className="receipt">
                <div className="receipt-heading">
                    <h3 className="receipt-address__head">{receipt.place.name}</h3>
                    <ShareLink link={receipt.inviteLink} className="receipt-share__link"/>
                </div>
                <section className="receipt-header__spending">
                    <div className="receipt-header__my-spending">Your spending: <span
                        className="receipt-header__my-spending-money">{mySpending.toFixed(2)}</span></div>
                    <Divider/>
                    <div className="receipt-header__total">Total: <span
                        className="receipt-header__total-money">{receipt.total.toFixed(2)}</span>
                    </div>
                    <Divider/>
                    <List dense disablePadding>
                        <ListSubheader>Items</ListSubheader>
                        {myItems}
                        <Divider inset={true}/>
                        {otherItems}
                    </List>
                </section>
                <NewItemModal itemCreatedCallback={() => {
                    this.closeAddNewItemPopup();
                    this.getReceiptFromServer()
                }}
                              opened={this.state.addNewItemPopupOpened}
                              closed={this.closeAddNewItemPopup.bind(this)}
                              receiptId={this.state.rec.id}/>
                <Snackbar
                    open={this.state.showItemDeletedMessage}
                    message={this.state.itemDeletedMessage}
                    action={[<Button key="undo" color="accent" dense
                                     onClick={() => this.undoDelete(this.state.rec.id, this.state.deletedItemId)}>UNDO</Button>]}
                    onClose={() => this.setState({showItemDeletedMessage: false})}
                    autoHideDuration={5000}
                />
            </section>);
    }


    renderItems() {
        let items = this.state.rec.orderedItems || [];
        let myItems = items.filter(Receipt.currentUsersOrderedItem)
                           .map(item => <OwnReceiptItem item={item}
                                                        receipt={this.state.rec}
                                                        changePending={this.changeIsPendingForItem(item)}
                                                        incrementItem={this.incrementItemCount.bind(this)}
                                                        deleteItem={this.deleteItem.bind(this)}
                                                        key={item.id}/>);

        let otherItems = items.filter(item => !Receipt.currentUsersOrderedItem(item))
                              .map(item => <ReceiptItem item={item} receipt={this.state.rec}
                                                        cloneItem={this.cloneItem.bind(this)}
                                                        changePending={this.changeIsPendingForItem(item)}
                                                        key={item.id}
                              />);
        return {myItems, otherItems}
    }

    static currentUsersOrderedItem(item) {
        return item.owner.id === storage.getState().user.id
    }

    changeIsPendingForItem(item) {
        return this.state.itemsIdWithPendingChange.indexOf(item.id) !== -1;
    }

    getReceiptFromServer(callback) {
        receiptService.getReceipt(this.props.match.params.id)
                      .subscribe(receipt => {
                              this.setState({rec: receipt});
                              storage.screenTitle(receipt.name);
                              callback && callback();
                          },
                          error => {
                              console.log("Can't obtain receipt due to " + error);
                              this.setState({notFoundError: true})
                          });
    }

    componentDidMount() {
        this.getReceiptFromServer();
        storage.addAddActionButtonMenuItem(storage.addAddActionButtonMenuItem(this.additionalAction));
        NavigationHistory.pushHistory("/receipts");
        this.receiptListener = receiptService.listenForReceiptChanges(this.props.match.params.id)
                                             .subscribe(data => this.getReceiptFromServer());
    }

    componentWillUnmount() {
        storage.removeAddActionButtonMenuItem(this.additionalAction);
        NavigationHistory.removeFromHistory("/receipts");
        this.receiptListener.unsubscribe();
    }

    incrementItemCount(receiptId, itemId) {
        this.markItemAsPendingForChange(itemId);
        receiptService.addOneItem(receiptId, itemId)
                      .subscribe(() => this.getReceiptFromServer(() => this.unMarkItemAsPendingForChange(itemId)))
    }

    deleteItem(receiptId, orderedItem) {
        let itemId = orderedItem.id;
        this.markItemAsPendingForChange(itemId);
        receiptService.deleteOneItem(receiptId, itemId)
                      .subscribe(data => {
                              this.getReceiptFromServer(() => {
                                  if (data.value) {
                                      this.setState({
                                          deletedItemId: itemId,
                                          itemDeletedMessage: `${orderedItem.item.name} was removed.`,
                                          showItemDeletedMessage: true
                                      });
                                  }
                                  this.unMarkItemAsPendingForChange(itemId);
                              });
                          }
                      );
    }

    cloneItem(receiptId, itemId) {
        this.markItemAsPendingForChange(itemId);
        receiptService.cloneItem(receiptId, itemId).subscribe(() => {
            this.getReceiptFromServer(() => this.unMarkItemAsPendingForChange(itemId))
        })
    }

    markItemAsPendingForChange(itemId) {
        this.setState(prevState => ({itemsIdWithPendingChange: [...prevState.itemsIdWithPendingChange, itemId]}))
    }

    unMarkItemAsPendingForChange(itemId) {
        this.setState(prevState => {
            let index = prevState.itemsIdWithPendingChange.indexOf(itemId);
            if (index !== -1) {
                return {
                    markItemAsPendingForChange: prevState.itemsIdWithPendingChange.splice(index, 1)
                }
            }
        })
    }

    undoDelete(receiptId, orderedItemId) {
        this.setState({
            showItemDeletedMessage: false,
            itemDeletedMessage: "",
            deletedItemId: ""
        });
        receiptService.undoDelete(receiptId, orderedItemId).subscribe(() => this.getReceiptFromServer());
    }
}