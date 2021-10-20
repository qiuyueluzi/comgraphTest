

var elems = { //ノード、エッジを作成
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

var childrenData = new Map(); //サブグラフに含まれるノードを記録する

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


var nodes = elems.nodes
for(var x = 0; x < nodes.length; x++){ //全ノード(サブグラフ)の子ノードの情報を記録
    var curNode = cy.$('#' + nodes[x].data.id);
    var id = curNode.data('id');

    var childrenNodes = curNode.children();
    var connectedChildEdges = curNode.children().connectedEdges();

    
    childrenData.set(id, {data:childrenNodes.union(connectedChildEdges), removed: false}); //各ノード(サブグラフ)が持つ、子ノードと子ノードに繋がるエッジを全て記録
}


var doubleClickDelayMs= 350; //ダブルクリック用
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

    if(childrenData.get(id).removed == true){ //サブグラフの削除フラグが立っている場合は復元する
        childrenData.get(id).data.restore();
        childrenData.get(id).removed = false;
    } else{
        recursivelyRemove(id, nodes);
    }


});

function recursivelyRemove(id,nodes){ //削除用
    var toRemove = [];

    for(;;){
      nodes.forEach(function(node){ //削除対象となるサブグラフ全てに削除フラグを付ける
        childrenData.get(node.data('id')).removed = true;
      });

        Array.prototype.push.apply(toRemove, nodes.children()); //削除対象のノードを配列に追加
        nodes = nodes.children(); //子サブグラフと子ノードを確認し、孫以下も含め全て削除対象にする
        if( nodes.empty() ){ break; } //全ての子孫の確認を終えればループ終了
    }

    for( var i = toRemove.length - 1; i >= 0; i-- ){
        toRemove[i].remove(); //削除対象を全て削除
    }
    
}

