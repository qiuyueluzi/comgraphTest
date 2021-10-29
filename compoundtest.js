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
    
    if(childrenNodes.length > 0)curNode.css('shape', 'square'); //子ノードを持つノード(サブグラフ)は形を変更(閉じた際に反映されている)
    
    childrenData.set(id, {node :childrenNodes, edge: connectedEdges.union(connectedChildEdges), parent: parentNode, removed: false});
  }

  for(var x = 0; x < edges.length; x++){ //初期状態での全エッジのソースとターゲットを記録
    edgesData.set(edges[x].data.id, {source: edges[x].data.source, target: edges[x].data.target});
  }
  console.log(childrenData)


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

    var restoreEdge = childrenData.get(id).edge[x]; //関連するエッジを1つずつ復元する
    var restoreEdgeID = childrenData.get(id).edge[x].id(); //復元エッジのID

    if(cy.$('#' + restoreEdgeID).target() != undefined && cy.$('#' + restoreEdgeID).source() != undefined){
      if(edgesData.get(restoreEdgeID).target != cy.$('#' + restoreEdgeID).target().id() || edgesData.get(restoreEdgeID).source != cy.$('#' + restoreEdgeID).source().id()){
        //idが重複するエッジを生成しようとした場合に、当該エッジが初期状態と異なる状態であれば実行される
        console.log('err1')
      
        cy.remove('#' + restoreEdgeID); //重複している現存エッジを消去する
        console.log('remove Edge ' + restoreEdgeID)
        x--; //ループ変数を減らしもう一度同じエッジの追加を行う
      }
    }
    else if(cy.$(restoreEdge.source()).length * cy.$(restoreEdge.target()).length == 0 ){ //復元エッジの両端どちらかが表示されていない場合、lengthが0になる
      console.log('err2')
      var newSource = edgesData.get(restoreEdgeID).source; //復元エッジのソース、ターゲットを取得
      var newTarget = edgesData.get(restoreEdgeID).target;
      var sFlag = (childrenData.get(childrenData.get(newSource).parent) == undefined ? false : childrenData.get(childrenData.get(newSource).parent).removed); 
      var tFlag = (childrenData.get(childrenData.get(newTarget).parent) == undefined ? false : childrenData.get(childrenData.get(newTarget).parent).removed); 
      //ソース、ターゲットの親のremoveを取得
      //removeがfalseであればnewソース、ターゲットは表示されている
      //ただし、初期状態から最上部のサブグラフを指していたエッジなどは親を読み込めないので三項演算子で弾く

      while(sFlag || tFlag){
        if(sFlag){ //親が閉じられているなら復元エッジのソースをその親に置き換え、更にその親のremoveを取得
          //親が表示されているノード(removeがfalseであるサブグラフ)が得られるまで登り続ける
          newSource = childrenData.get(newSource).parent;
          sFlag = childrenData.get(childrenData.get(newSource).parent).removed;
        }
        
        if(tFlag){
          newTarget = childrenData.get(newTarget).parent;
          tFlag = childrenData.get(childrenData.get(newTarget).parent).removed;
        }

      }
      if(newSource!=newTarget){ //自己ループにならないならエッジを追加
        cy.add({group: 'edges', data:{id: restoreEdgeID, source: newSource, target: newTarget}})
        console.log('create Edge ' + restoreEdgeID)
      }
    }
    else{
      cy.add(childrenData.get(id).edge[x]) //ノードに関連するエッジを復元、ただしソースかターゲットが存在しない場合があるのでエラーを捕捉する
      console.log(childrenData.get(id).edge[x].id() + ' : restore')
    }
  }
}

function recursivelyRemove(id,nodes){ //ノードを閉じる
  var toRemove = [];

  for(;;){
    nodes.forEach(function(node){ //選択されたノードと子のremoveフラグを全てtrueにする
      childrenData.get(node.data('id')).removed = true;
    });

    Array.prototype.push.apply(toRemove, nodes.children()); //削除する全ての子ノードをプッシュ
      nodes = nodes.children();
      if( nodes.empty() ){ break; }
    }

  for( var i = toRemove.length - 1; i >= 0; i-- ){ //当該サブグラフに関連するエッジ全てを一度削除する
    var remEdge = toRemove[i].connectedEdges();
    for(var j = 0; j < remEdge.length; j++){
      if(remEdge[j].target().parent() != remEdge[j].source().parent()){ //他のサブグラフを跨ぐエッジ(ソースとターゲットの親が別のエッジ)は置き換える
        var replaceEdge = remEdge[j]; //removeを行うエッジ(remEdge[j])はremove後は参照できないので別の変数に記録する
        remEdge[j].remove();

        var newSource; //ソース、ターゲットのうち削除される方は親に置き換える
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
      } //親しか参照してないけど何故か孫以下も丸ごと削除しても、ちゃんと表示されてる一番上の親に置き換わる
    }  //最下層から順に消してて、都度1段ずつ上に置き換えられてるのかしら　よくわかんないです
    toRemove[i].remove();
  }

}
    
