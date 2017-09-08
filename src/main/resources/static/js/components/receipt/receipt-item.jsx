import {ListItem} from "material-ui/List";
import Avatar from "material-ui/Avatar";
import FontIcon from "material-ui/FontIcon";
import CircularProgress from 'material-ui/CircularProgress';
import Snackbar from 'material-ui/Snackbar';

import "./receipt.css";

export class OwnReceiptItem extends React.Component {

    constructor(args) {
        super(args);
        this.state = {
            waitingForResult: false,
            item: this.props.item,
            showItemDeletedMessage: false,
            itemDeletedMessage: "",
            deletedItemId: ""
        }
    }

    render() {
        return (
            <div>
                <CommonComponent {...this.props}
                                 actionButtons={this.actionButtons(this.props.receipt, this.state.item)}/>
                <Snackbar
                    open={this.state.showItemDeletedMessage}
                    message={this.state.itemDeletedMessage}
                    action="undo"
                    onActionTouchTap={() => this.undoDelete(this.props.receipt.id, this.state.deletedItemId)}
                    onRequestClose={() => this.setState({showItemDeletedMessage: false})}
                />
            </div>
        )
    }

    actionButtons(receipt, orderedItem) {
        if (this.state.waitingForResult) {
            return [<CircularProgress/>]
        } else {
            return [
                <FontIcon className="fa fa-minus-circle receipt-item-actions__action"
                          key={"MinusItem" + orderedItem.id}
                          onTouchTap={() => this.deleteItem(receipt.id, orderedItem)}/>,
                <FontIcon className="fa fa-plus-circle receipt-item-actions__action" key={"PlusItem" + orderedItem.id}
                          onTouchTap={() => this.cloneItem(receipt.id, orderedItem.id)}/>
            ]
        }
    }

    orderedItemsUpdated() {
        this.setState({waitingForResult: false});
        this.props.shouldUpdate();
    }

    cloneItem(receiptId, itemId) {
        this.setState({waitingForResult: true});
        $.post(`/v1/receipt/${receiptId}/item/${itemId}/duplicate`).done(() => this.orderedItemsUpdated());
    }

    deleteItem(receiptId, orderedItem) {
        let itemId = orderedItem.id;
        this.setState({
            waitingForResult: true
        });
        $.ajax({
            url: `/v1/receipt/${receiptId}/item/${itemId}`,
            method: "DELETE",
            success: () => {
                this.setState({
                    deletedItemId: itemId,
                    itemDeletedMessage: `1 ${orderedItem.item.name} was removed.`,
                    showItemDeletedMessage: true
                });
                this.orderedItemsUpdated();
            }
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.item.id !== this.state.item.id) {
            this.setState({item: nextProps.item});
        }
    }

    undoDelete(receiptId, orderedItemId) {
        this.setState({
            showItemDeletedMessage: false,
            itemDeletedMessage: "",
            deletedItemId: ""
        });
        $.post(`/v1/receipt/${receiptId}/item/${orderedItemId}/restore`).done(() => this.props.shouldUpdate());
    }
}

export class ReceiptItem extends React.Component {
    render() {
        return (<CommonComponent {...this.props} actionButtons={this.actionButtons(this.props.item)}/>)
    }

    actionButtons(item) {
        return [<div key={"MeeToo" + item.id} className="receipt-item-actions__action">Me too!</div>]
    }
}

class CommonComponent extends React.Component {

    render() {
        let orderedItem = this.props.item;
        let total = orderedItem.sum;
        let text = `${orderedItem.item.name} - \$${orderedItem.item.price} x ${orderedItem.count}. Total: ${total.toFixed(2)}`;

        return (
            <ListItem primaryText={text}
                      leftAvatar={<Avatar src={orderedItem.owner.avatarUrl}/>}
                      children={this.children()}
                      className="receipt-item"
                      key={"ListItem" + orderedItem.id}
            />
        )
    }

    children() {
        return (
            <div className="receipt-item__actions">
                {this.props.actionButtons}
            </div>
        );

    }
}