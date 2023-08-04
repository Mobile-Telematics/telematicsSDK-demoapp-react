import Foundation
import RaxelPulse

class TagsStateDelegate: NSObject, RPTagsServerStateDelegate {
    
    var addTagPromise: Promise?
    var removeAllPromise: Promise?
    var deleteTagPromise: Promise?
    var getTagsPromise: Promise?
    
    override init() {
        super.init()
    }
    
    private func parseStatus(status: RPTagStatus) -> NSString {
        switch status {
        case .SUCCESS:
            return "Success"
        case .OFFLINE:
            return "Offline"
        case .ERROR_WRONG_TIME:
            return "Wrong time"
        case .ERROR_TAG_OPERATION:
            return "Wrong tag operation"
        case .ERROR_INVALIND_TAG_SPECIFIED:
            return "Invalid tag specified"
        @unknown default:
            return "Unknown error"
        }
    }
    
    func addTag(_ status: RPTagStatus, tag: RPTag!, timestamp: Int) {
        let state = parseStatus(status: status)
        let jsonTag = ["tag": tag.tag, "source": tag.source]
        let json: [String: Any?] = ["status": state, "tag": jsonTag]
        if let promise = addTagPromise {
            promise.resolve(json)
        }
    }
    
    func deleteTag(_ status: RPTagStatus, tag: RPTag!, timestamp: Int) {
        let state = parseStatus(status: status)
        let jsonTag = ["tag": tag.tag, "source": tag.source]
        let json: [String: Any?] = ["status": state, "tag": jsonTag]
        if let promise = deleteTagPromise {
            promise.resolve(json)
        }
    }
    
    func getTags(_ status: RPTagStatus, tags: Any!, timestamp: Int) {
        let state = parseStatus(status: status)
        let tagsList = tags as? [RPTag]
        var jsonTags = [[String : String?]]()
        if let list = tagsList {
            jsonTags = list.map {["tag": $0.tag, "source": $0.source]}
        }
        let result: [String: Any] = ["status": state, "tags": jsonTags]
        if let promise = getTagsPromise {
            promise.resolve(result)
        }
    }
    
    func removeAll(_ status: RPTagStatus, timestamp: Int) {
        let state = parseStatus(status: status)
        if let promise = removeAllPromise {
            promise.resolve(state)
        }
    }
    
    func addFutureTag(_ status: RPTagStatus, tag: RPTag!, timestamp:Int){
      
    }
    
    func removeFutureTrackTag(_ status: RPTagStatus, tag: RPTag!, timestamp:Int) {
       
    }
    
    func removeAllFutureTrackTag(_ status: RPTagStatus!, timestamp:Int) {
       
    }
}

