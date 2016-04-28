// This list stores the items to be prioritized.

/*
Todo:
Clear the list
Enable user to enter the criteria for comparison, e.g. "which is better?"

*/
itemsList = new Mongo.Collection('items');

if (Meteor.isClient) {

  var getInitialItem = function() {
    var total = itemsList.find().count();
    var items = itemsList.find({
      numVotes: {
        $lt: total
      }
    }).fetch();
    return _.sample(items);
  };

  var getSecondItem = function({
    _id, votes
  }) {
    var alreadyVotedIds = _.pluck(votes, "comparedId")
    alreadyVotedIds.push(_id);
    var unPaired = itemsList.find({
      _id: {
        $nin: alreadyVotedIds
      }
    }).fetch();
    return _.sample(unPaired);
  }

  var addVote = function({
    winnerId, loserId
  }) {
    itemsList.update(winnerId, {
      $inc: {
        score: 1,
        numVotes: 1
      },
      $push: {
        votes: {
          comparedId: loserId,
          score: 1
        }
      }
    });
    itemsList.update(loserId, {
      $inc: {
        numVotes: 1
      },
      $push: {
        votes: {
          comparedId: winnerId,
          score: 0
        }
      }
    });
  }
// Need a way to clear the field below.
  Template.addItemForm.events({  //adding a new item
    'submit form': function(event) {
      event.preventDefault(); //prevent the browser from taking over
      var itemNameVar = event.target.itemName.value;
      itemsList.insert({
        name: itemNameVar,
        score: 0,
        votes: [],
        numVotes: 0,
      })
      console.log(itemNameVar);
      votingPairs.loadPairs();
      $("addItemForm").value("");

    }
// $("addItemForm").value("");
  });

  Template.leaderboard.helpers({
    'item': function() {
      return itemsList.find({}, {
        sort: {
          score: -1,
          name: 1
        }
      })
    },
    'count': function() {},
    'selectedClass': function() {
      var itemId = this._id;
      var selectedItem = Session.get('selectedItem');
      if (itemId == selectedItem) {
        return "selected"
      }
    },
    'showSelectedItem': function() {
      var selectedItem = Session.get('selectedItem');
      return itemsList.findOne(selectedItem)
    },
    'removeItem': function() {

    }
  });
  Template.leaderboard.events({
    'click .item': function() {
      var itemId = this._id;
      Session.set('selectedItem', itemId);
    },
    'click .increment': function() {
      var selectedItem = Session.get('selectedItem');
      itemsList.update(selectedItem, {
        $inc: {
          score: 5
        }
      });
    },
    'click .decrement': function() {
      var selecteditem = Session.get('selecteditem');
      itemsList.update(selectedItem, {
        $inc: {
          score: -5
        }
      });
    },
    'click .remove': function() {
      var selectedItem = Session.get('selectedItem');
      itemsList.remove(selectedItem);
    },

  });

  Template.votingPairs.helpers({

    'totalPairs': function() {
      var pairsCount = itemsList.find().count() - 1;
      pairsCount = (pairsCount * (pairsCount + 1)) / 2;
      return pairsCount;
    },

    'pairItems': function() {
      var initialItem = getInitialItem();
      var comparedWithItem = getSecondItem(initialItem);
      return {
        initialItem, comparedWithItem
      };
    }


  });

  Template.votingPairs.events({
    'click .btn-vote': function(event, template) {
      event.preventDefault();
      var winnerId = $(event.target)[0].value;
      var loserId = $(event.target)[0].dataset.comparedwith;
      addVote({winnerId , loserId});

    }
  });
}
