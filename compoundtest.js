

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
  
  
  var childrenData = new Map(); //サブグラフに含まれるノードを記録する
  var edgesData = new Map();
  var nodes = elems.nodes;
  var edges = elems.edges;

  for(var x = 0; x < nodes.length; x++){ //初期状態での全ノードの、子ノードと関連するエッジの情報を記録
    var curNode = cy.$('#' + nodes[x].data.id);
    var id = curNode.data('id');
    
    var childrenNodes = curNode.children(); //当ノードの子ノード
    var connectedEdges = curNode.connectedEdges(); //当ノードに接続するエッジ
    var connectedChildEdges = curNode.descendants().connectedEdges(); //当ノードの子ノードに接続するエッジ
    var parentNode = nodes[x].data.parent; //当ノードの親ノード
    
    childrenData.set(id, {node :childrenNodes, edge: connectedEdges.union(connectedChildEdges), parent: parentNode, removed: false});
  }

  for(var x = 0; x < edges.length; x++){ //初期状態での全エッジのソースとターゲットを記録
    edgesData.set(edges[x].data.id, {source: edges[x].data.source, target: edges[x].data.target});
  }



var doubleClickDelayMs= 350; //ダブルクリックを認識する関数
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
      restoreChildren(id, nodes);
    } else{
      recursivelyRemove(id, nodes);
    }

    console.log('finish')

});


function restoreChildren(id, nodes){ //ノードを開く
  childrenData.get(id).removed = false;
  childrenData.get(id).node.restore(); //子ノードを復元

  for(var x=0; x<childrenData.get(id).edge.length; x++){
    try{
      cy.add(childrenData.get(id).edge[x]) //ノードに関連するエッジを復元、ただしソースかターゲットが存在しない場合があるのでエラーを捕捉する
      console.log(childrenData.get(id).edge[x].id() + ' : restore')
      
    }catch(error){
      console.log(error.message)
      var errlog = error.message.split('`'); //エラーメッセージから生成したいエッジを取得
      var originID = errlog[1];
      if(errlog[3]){ //ソースかターゲットが存在しない場合、errlog[3]が存在するエラーメッセージが得られる
        console.log('err3')
        var nodeID = errlog[3];
        var parentNode = childrenData.get(nodeID).parent;
        //削除されているソースかターゲットの親を取得し、エッジをそちらに置き換える
        if(error.message.match('target')){
          cy.add({group: 'edges', data:{id: originID, source: edgesData.get(originID).source, target: parentNode}})
          console.log('create Edge ' + originID)
        }
        else if(error.message.match('source')){ //ソースもターゲットも存在しない場合にもこちらが実行される
          try{
            cy.add([{group: 'edges', data:{id: originID, source: parentNode, target: edgesData.get(originID).target}}])
            console.log('create Edge ' + originID)
          }catch(error){
            console.log('err4')
            console.log(error.message)
            var errlog2 = error.message.split('`');
            var nodeID2 = errlog2[3];
            var parentNode2 = childrenData.get(nodeID2).parent;
            //ソース、ターゲットが存在せず、両方の親が表示されている場合にはそれらを繋ぐエッジを生成する
            if(parentNode!=parentNode2&&
              !childrenData.get(childrenData.get(childrenData.get(nodeID).parent).parent).removed&&
              !childrenData.get(childrenData.get(childrenData.get(nodeID2).parent).parent).removed){
                cy.add({group: 'edges', data:{id: originID, source: parentNode, target: parentNode2}})
                console.log('create Edge ' + originID)
              }
            }
            
        }
        else{console.log('nanka okashii');}    
      }
      else if(edgesData.get(originID).target != cy.$('#' + originID).target().id() || edgesData.get(originID).source != cy.$('#' + originID).source().id()){
        //idが重複するエッジを生成しようとした場合に、当該エッジが初期状態と異なる状態であれば実行される
        console.log('err1')
        
        cy.remove('#' + originID);
        console.log('remove Edge ' + originID)
        x--;
      }
      else {console.log('nandaka okashii')}
    }
  }

}

function recursivelyRemove(id,nodes){ //ノードを閉じる
  var toRemove = [];

  for(;;){
    nodes.forEach(function(node){
      childrenData.get(node.data('id')).removed = true;
    });

    Array.prototype.push.apply(toRemove, nodes.children());
      nodes = nodes.children();
      if( nodes.empty() ){ break; }
    }

  for( var i = toRemove.length - 1; i >= 0; i-- ){ //サブグラフを跨ぐエッジを削除した場合、置き換える
    var remEdge = toRemove[i].connectedEdges();
    for(var j = 0; j < remEdge.length; j++){
      if(remEdge[j].target().parent() != remEdge[j].source().parent()){
        var replaceEdge = [remEdge[j], remEdge[j].id(), remEdge[j].source().id(), remEdge[j].target().id(), remEdge[j].source().parent().id(), remEdge[j].target().parent().id()];
        remEdge[j].remove();
        if(replaceEdge[0].target() == toRemove[i])cy.add({group: 'edges', data:{id: replaceEdge[1], source: replaceEdge[2], target: replaceEdge[5]}})
        else if(replaceEdge[0].source() == toRemove[i])cy.add({group: 'edges', data:{id: replaceEdge[1], source: replaceEdge[4], target: replaceEdge[3]}})
      }
    }
    
    toRemove[i].remove();
  }
}
    
