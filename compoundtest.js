var elems = {
    nodes: [
        {data: { id: 'A', parent: 'g111'}},
        {data: { id: 'B', parent: 'g112'}},
        {data: { id: 'C', parent: 'g112'}},
        {data: { id: 'D', parent: 'g11'}},
        {data: { id: 'E', parent: 'g121'}},
        {data: { id: 'F', parent: 'g121'}},
        {data: { id: 'G', parent: 'g12'}},
        {data: { id: 'H', parent: 'g12'}},
        {data: { id: 'g1'}},
        {data: { id: 'g11', parent: 'g1'}},
        {data: { id: 'g12', parent: 'g1'}},
        {data: { id: 'g111', parent: 'g11'}},
        {data: { id: 'g112', parent: 'g11'}},
        {data: { id: 'g121', parent: 'g12'}}

    ],
    edges: [
        {data: { id: 'e0', source: 'A', target: 'C' }},
        {data: { id: 'e1', source: 'B', target: 'C' }},
        {data: { id: 'e2', source: 'D', target: 'g111' }},
        {data: { id: 'e3', source: 'E', target: 'F' }},
        {data: { id: 'e4', source: 'E', target: 'H' }},
        {data: { id: 'e5', source: 'F', target: 'H' }},
        {data: { id: 'e6', source: 'G', target: 'E' }},
        {data: { id: 'e7', source: 'g11', target: 'g12' }},
        {data: { id: 'e8', source: 'A', target: 'F' }},
        {data: { id: 'e9', source: 'F', target: 'g12' }},
        {data: { id: 'e10', source: 'E', target: 'g1' }},
    ]
};




var cy = cytoscape({
  container: document.getElementById('cy'),
  autounselectify: true,
    style: [
      {
        selector: 'node',
        css: {
          'content': 'data(id)',
          'text-halign': 'center',
          'text-valign': 'center',
          'background-color': '#20bd3d'
        }
      },
        
      {
        selector: 'node:parent',
        css: {
                'text-valign': 'top',
                'text-halign': 'left',
                'background-opacity': 0.25
              }
        },
        
        {
          selector: 'edge',
          css: {
            'content': 'data(id)',
            'line-color': '#09691b',
            'curve-style': 'bezier',
            'target-arrow-color': '#09691b',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
    elements: elems,
    layout: {
      name: 'cola',
      directed: true,
      animate: false
    }
  });
  
  
  var childrenData = new Map(); //??????????????????????????????????????????????????????
  var edgesData = new Map();
  var nodes = elems.nodes;
  var edges = elems.edges;

  for(var x = 0; x < nodes.length; x++){ //??????????????????????????????????????????????????????????????????????????????????????????
    var curNode = cy.$('#' + nodes[x].data.id);
    var id = curNode.data('id');
    
    var childrenNodes = curNode.children(); //???????????????????????????
    var connectedEdges = curNode.connectedEdges(); //????????????????????????????????????
    var connectedChildEdges = curNode.descendants().connectedEdges(); //???????????????????????????????????????????????????
    var parentNode = nodes[x].data.parent; //???????????????????????????
    
    if(childrenNodes.length > 0)curNode.css('shape', 'square'); //??????????????????????????????(???????????????)???????????????(????????????????????????????????????)
    
    childrenData.set(id, {node :childrenNodes, edge: connectedEdges.union(connectedChildEdges), parent: parentNode, removed: false});
  }

  for(var x = 0; x < edges.length; x++){ //?????????????????????????????????????????????????????????????????????
    edgesData.set(edges[x].data.id, {source: edges[x].data.source, target: edges[x].data.target});
  }
  console.log(childrenData)


var doubleClickDelayMs= 350; //??????????????????????????????????????????
var previousTapStamp;
cy.on('tap', function(e) {
    var currentTapStamp= e.timeStamp;
    var msFromLastTap= currentTapStamp -previousTapStamp;
    if (msFromLastTap < doubleClickDelayMs) {
        e.target.trigger('doubleTap', e);
    }
    previousTapStamp= currentTapStamp;
});

cy.on('doubleTap', 'node', function(){ //????????????????????????????????????
    var nodes = this;
    var id = nodes.data('id')

    if(childrenData.get(id).removed == true){
      restoreChildren(id, nodes);
    } else{
      recursivelyRemove(id, nodes);
    }

    console.log('finish')

});


function restoreChildren(id, nodes){ //??????????????????
  childrenData.get(id).removed = false;
  childrenData.get(id).node.restore(); //?????????????????????

  for(var x=0; x<childrenData.get(id).edge.length; x++){

    var restoreEdge = childrenData.get(id).edge[x]; //????????????????????????1?????????????????????
    var restoreEdgeID = childrenData.get(id).edge[x].id(); //??????????????????ID

    if(cy.$('#' + restoreEdgeID).target() != undefined && cy.$('#' + restoreEdgeID).source() != undefined){
      if(edgesData.get(restoreEdgeID).target != cy.$('#' + restoreEdgeID).target().id() || edgesData.get(restoreEdgeID).source != cy.$('#' + restoreEdgeID).source().id()){
        //id??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        console.log('err1')
      
        cy.remove('#' + restoreEdgeID); //????????????????????????????????????????????????
        console.log('remove Edge ' + restoreEdgeID)
        x--; //????????????????????????????????????????????????????????????????????????
      }
    }
    else if(cy.$(restoreEdge.source()).length * cy.$(restoreEdge.target()).length == 0 ){ //????????????????????????????????????????????????????????????????????????length???0?????????
      console.log('err2')
      var newSource = edgesData.get(restoreEdgeID).source; //??????????????????????????????????????????????????????
      var newTarget = edgesData.get(restoreEdgeID).target;
      var sFlag = (childrenData.get(childrenData.get(newSource).parent) == undefined ? false : childrenData.get(childrenData.get(newSource).parent).removed); 
      var tFlag = (childrenData.get(childrenData.get(newTarget).parent) == undefined ? false : childrenData.get(childrenData.get(newTarget).parent).removed); 
      //????????????????????????????????????remove?????????
      //remove???false????????????new???????????????????????????????????????????????????
      //???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

      while(sFlag || tFlag){
        if(sFlag){ //????????????????????????????????????????????????????????????????????????????????????????????????????????????remove?????????
          //????????????????????????????????????(remove???false????????????????????????)????????????????????????????????????
          newSource = childrenData.get(newSource).parent;
          sFlag = childrenData.get(childrenData.get(newSource).parent).removed;
        }
        
        if(tFlag){
          newTarget = childrenData.get(newTarget).parent;
          tFlag = childrenData.get(childrenData.get(newTarget).parent).removed;
        }

      }
      if(newSource!=newTarget){ //??????????????????????????????????????????????????????
        cy.add({group: 'edges', data:{id: restoreEdgeID, source: newSource, target: newTarget}})
        console.log('create Edge ' + restoreEdgeID)
      }
    }
    else{
      cy.add(childrenData.get(id).edge[x]) //????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      console.log(childrenData.get(id).edge[x].id() + ' : restore')
    }
  }
}

function recursivelyRemove(id,nodes){ //?????????????????????
  var toRemove = [];

  for(;;){
    nodes.forEach(function(node){ //?????????????????????????????????remove??????????????????true?????????
      childrenData.get(node.data('id')).removed = true;
    });

    Array.prototype.push.apply(toRemove, nodes.children()); //????????????????????????????????????????????????
      nodes = nodes.children();
      if( nodes.empty() ){ break; }
    }

  for( var i = toRemove.length - 1; i >= 0; i-- ){ //????????????????????????????????????????????????????????????????????????
    var remEdge = toRemove[i].connectedEdges();
    for(var j = 0; j < remEdge.length; j++){
      if(remEdge[j].target().parent() != remEdge[j].source().parent()){ //???????????????????????????????????????(???????????????????????????????????????????????????)??????????????????
        var replaceEdge = remEdge[j]; //remove??????????????????(remEdge[j])???remove?????????????????????????????????????????????????????????
        remEdge[j].remove();

        var newSource; //??????????????????????????????????????????????????????????????????????????????
        var newTarget;
        if(replaceEdge.target() == toRemove[i]){
          newSource = replaceEdge.source().id();
          newTarget = replaceEdge.target().parent().id();
        }
        else if(replaceEdge.source() == toRemove[i]){
          newSource = replaceEdge.source().parent().id();
          newTarget = replaceEdge.target().id();
        }
        if(newSource != newTarget)cy.add({group: 'edges', data:{id: replaceEdge.id(), source: newSource, target: newTarget}})
      } //????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
    }  //??????????????????????????????????????????1?????????????????????????????????????????????????????????????????????????????????
    toRemove[i].remove();
  }

}
    
