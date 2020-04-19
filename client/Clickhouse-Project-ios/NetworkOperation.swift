//
//  NetworkOperation.swift
//  Clickhouse-Project-ios
//
//  Created by Александр Плесовских on 03/12/2019.
//  Copyright © 2019 Alex. All rights reserved.
//


import UIKit


//Операция получения уведомлений
class NetworkOperation: Operation
{
	var resultBlock: ((NetworkResponse?)->Void)?
	var body: NetworkRequestBody
	
	init(body: NetworkRequestBody, resultBlock: ((NetworkResponse?) -> Void)?) {
		self.body = body
		super.init()
		self.resultBlock = resultBlock
	}
	
	override func main()
	{
		let token = """
{token}
"""
		let url = URL.Graph.getGraphURL()
		var request = URLRequest(url: url)
		request.httpBody = try? JSONEncoder().encode(self.body)
		request.httpMethod = "POST"
		request.setValue(token, forHTTPHeaderField: "token")
		request.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
		
		print(self.body)
		let dataTask = URLSession.shared.dataTask(with: request) { (data, response, error) in
			guard let data = data, error == nil else {
				print(error ?? "NetworkOperationError")
				self.resultBlock?(nil)
				return
			}
			do {
				print(String(data: data, encoding: String.Encoding.utf8) ?? "не удалось")

				let decoder = JSONDecoder()
				let formatter = DateFormatter()
				//"timestamp":"2019-12-01 17:00:00.000+0300",
				formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSSZ"
				//formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
				decoder.dateDecodingStrategy = .formatted(formatter)
				//Получим данные
				let response = try decoder.decode(NetworkResponse.self, from: data)
				
				self.resultBlock?(response)
			}
			catch {
				print(error)
			}
		}
		dataTask.resume()
	}
}
