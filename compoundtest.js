

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
        {data: { id: 'e8', source: 'g11', target: 'g121' }},
        {data: { id: 'e9', source: 'F', target: 'g12' }},
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
                'background-opacity': 0.333
              }
        },
        
        {
          selector: 'edge',
          css: {
            //'content': 'data(id)',
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
  
  
  var childrenData = new Map(); //サブグラフに含まれるノードを記録する
  var edgesData = new Map();
  var nodes = elems.nodes;
  var edges = elems.edges;
  for(var x = 0; x < nodes.length; x++){ //全ノード(サブグラフ)の子ノードの情報を記録
    var curNode = cy.$('#' + nodes[x].data.id);
    var id = curNode.data('id');
    
    var childrenNodes = curNode.children();
    var descendantsNodes = curNode.descendants().id();
    var connectedChildEdges = curNode.descendants().connectedEdges();
    var connectedEdges = curNode.connectedEdges();
    var parentNode = nodes[x].data.parent;
    
    childrenData.set(id, {node :childrenNodes, desNode: descendantsNodes, childEdge: connectedChildEdges, edge: connectedEdges, parent: parentNode, removed: false});
  }
  console.log(childrenData)
  for(var x = 0; x < edges.length; x++){
    var curEdge = cy.$('#' + edges[x].data.id);
    var id = curEdge.data('id');
    var curSource = curEdge.source();
    var curTarget = curEdge.target();

    edgesData.set(edges[x].data.id, {source: edges[x].data.source, target: edges[x].data.target});
    
  }
  console.log(edgesData)

var doubleClickDelayMs= 350;
var previousTapStamp;
cy.on('tap', function(e) {
    var currentTapStamp= e.timeStamp;
    var msFromLastTap= currentTapStamp -previousTapStamp;
    if (msFromLastTap < doubleClickDelayMs) {
        e.target.trigger('doubleTap', e);
    }
    previousTapStamp= currentTapStamp;
});
cy.on('doubleTap', 'node', function(){ //フラグに応じて削除・復元
    var nodes = this;
    var id = nodes.data('id')

    if(childrenData.get(id).removed == true){
      restoreChildren(id, nodes, 0);
      console.log(childrenData)
    } else{
        recursivelyRemove(id, nodes);
    }


});

cy.on('doubleTap', 'edge', function(){
    var edges = this;
    edges.remove();
}

function restoreChildren(id, nodes, loopBlock){
  childrenData.get(id).node.restore();
  try{
    childrenData.get(id).edge.restore();
    childrenData.get(id).childEdge.restore();
  }catch(error){
    console.log(error.message)
    var errlog = error.message.split('`');
    var originID = errlog[1];
    if(errlog[3]){
      console.log('err3')
      var nodeID = errlog[3];
      var parentNode = childrenData.get(nodeID).parent;

      if(error.message.match('target')){
        cy.add({group: 'edges', data:{id: originID, source: edgesData.get(originID).source, target: parentNode}})
        console.log('create Edge ' + originID)
      }
      else if(error.message.match('source')){
        try{
        cy.add([{group: 'edges', data:{id: originID, source: parentNode, target: edgesData.get(originID).target}}])
        console.log('create Edge ' + originID)
        }catch(error){
          console.log(error.message)
          var errlog2 = error.message.split('`');
          var nodeID2 = errlog2[3];
          var parentNode2 = childrenData.get(nodeID2).parent;
          cy.add({group: 'edges', data:{id: originID, source: parentNode, target: parentNode2}})
        }
      }
      else{console.log('nanka okashii');}

    }
    else if(edgesData.get(originID).target != cy.$('#' + originID).target().id() || edgesData.get(originID).source != cy.$('#' + originID).source().id()){
      console.log('err1')
      
      cy.remove('#' + originID);
      console.log('remove Edge ' + originID)
      if(loopBlock != originID){
        loopBlock = originID;
        restoreChildren(id, nodes, loopBlock);
      }
      else console.log('Loop Block')
    }
    else {console.log('nandaka okashii')}
  }
  childrenData.get(id).removed = false;
}

function recursivelyRemove(id,nodes){ //削除用
    var toRemove = [];


    for(;;){
      nodes.forEach(function(node){
        childrenData.get(node.data('id')).removed = true;
      });

      
      Array.prototype.push.apply(toRemove, nodes.children());
        nodes = nodes.children();
        if( nodes.empty() ){ break; }
      }

      for( var i = toRemove.length - 1; i >= 0; i-- ){
        var ed = toRemove[i].connectedEdges();

        for(var j = 0; j < ed.length; j++){
          if(ed[j].target().parent() != ed[j].source().parent()){
            var res = [ed[j], ed[j].id(), ed[j].source().id(), ed[j].target().id(), ed[j].source().parent().id(), ed[j].target().parent().id()];
            ed[j].remove();
            if(res[0].target() == toRemove[i])cy.add({group: 'edges', data:{id: res[1], source: res[2], target: res[5]}})
            else if(res[0].source() == toRemove[i])cy.add({group: 'edges', data:{id: res[1], source: res[4], target: res[3]}})
          }
        }
        
        toRemove[i].remove();
      }

    
    }
    
