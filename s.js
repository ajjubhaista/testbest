let arr = [2, 14, 6, 4, 24, 1]
function recursiveSort(data, len) {
    for (let i = 0; i < len; i++) {

        for (let j = 0; j < len; j++) {
            if(data[j]>data[j+1]){
                let con = data[j]
               data[j] = data[j+1]
               data[j+1] = con
            }
        }
    }
}

let len = arr.length

recursiveSort(arr, len)
console.log(arr)
